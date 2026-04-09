import { describe, expect, it } from 'vitest'
import type { MapData } from '../src/types/map'
import { clampNavigatorOffset, computeCenteredTransformForRoom, getMapCellBounds, getRoomCellBounds, hitTestRoomAtCell, isRoomOutsideView } from '../src/lib/roomNavigatorMath'

describe('roomNavigatorMath', () => {
  const mapData: MapData = {
    width: 100,
    height: 100,
    zones: { 1: { name: 'Z', color: '#fff' } },
    rooms: [
      // Room without rects
      { id: 1, x: 10, y: 10, w: 4, h: 3, zone_id: 1, type: 'normal', rects: [], neighbors: [] },
      // Room with rects (L-shape style)
      { id: 2, x: 20, y: 20, w: 10, h: 10, zone_id: 1, type: 'normal', rects: [[0, 0, 2, 2], [0, 2, 5, 1]], neighbors: [] },
    ],
  }

  it('getRoomCellBounds는 rects가 없으면 x/y/w/h 기반 바운드를 반환한다', () => {
    const b = getRoomCellBounds(mapData.rooms[0]!)
    expect(b).toEqual({ minX: 10, minY: 10, maxX: 14, maxY: 13 })
  })

  it('getRoomCellBounds는 rects가 있으면 모든 rect를 포함하는 바운드를 반환한다', () => {
    const b = getRoomCellBounds(mapData.rooms[1]!)
    expect(b).toEqual({ minX: 20, minY: 20, maxX: 25, maxY: 23 })
  })

  it('hitTestRoomAtCell은 rects가 없는 방을 맞춘다', () => {
    expect(hitTestRoomAtCell(mapData, 10, 10)?.id).toBe(1)
    expect(hitTestRoomAtCell(mapData, 13.999, 12.999)?.id).toBe(1)
    expect(hitTestRoomAtCell(mapData, 14, 12)).toBe(null) // right edge exclusive
    expect(hitTestRoomAtCell(mapData, 13, 13)).toBe(null) // bottom edge exclusive
  })

  it('hitTestRoomAtCell은 rects가 있는 방을 맞춘다', () => {
    expect(hitTestRoomAtCell(mapData, 20, 20)?.id).toBe(2)
    expect(hitTestRoomAtCell(mapData, 21.999, 21.999)?.id).toBe(2)
    expect(hitTestRoomAtCell(mapData, 24.999, 22.999)?.id).toBe(2)
    expect(hitTestRoomAtCell(mapData, 22, 23)).toBe(null)
  })

  it('computeCenteredTransformForRoom은 방 중심을 뷰 중앙으로 맞춘다', () => {
    const tr = computeCenteredTransformForRoom({
      viewWidthPx: 200,
      viewHeightPx: 100,
      scalePxPerCell: 10,
      room: mapData.rooms[0]!,
    })
    // Room1 bounds center: x=(10+14)/2=12, y=(10+13)/2=11.5
    expect(tr.offsetX).toBe(200 / 2 - 12 * 10)
    expect(tr.offsetY).toBe(100 / 2 - 11.5 * 10)
    expect(tr.scalePxPerCell).toBe(10)
  })

  it('getMapCellBounds는 모든 방을 포함하는 바운드를 반환한다', () => {
    const b = getMapCellBounds(mapData)
    // Room1 bounds: [10,10]~[14,13], Room2 bounds: [20,20]~[25,23]
    expect(b).toEqual({ minX: 10, minY: 10, maxX: 25, maxY: 23 })
  })

  it('isRoomOutsideView는 현재 방이 뷰 밖이면 true다', () => {
    // View covers cellX in [0,10] at scale=10 offsetX=0 (px), width=100px
    const outside = isRoomOutsideView({
      viewWidthPx: 100,
      viewHeightPx: 100,
      scalePxPerCell: 10,
      offsetX: 0,
      offsetY: 0,
      room: mapData.rooms[0]!,
    })
    expect(outside).toBe(true) // room starts at cellX=10, edge-exclusive means not visible
  })

  it('clampNavigatorOffset은 컨텐츠가 뷰에서 완전히 벗어나지 않게 offset을 제한한다', () => {
    const mapBounds = getMapCellBounds(mapData)
    const clamped = clampNavigatorOffset({
      viewWidthPx: 200,
      viewHeightPx: 100,
      scalePxPerCell: 10,
      offsetX: -9999,
      offsetY: -9999,
      mapBounds,
      marginPx: 0,
    })

    // With margin=0, content right/bottom should still be >= 0 (visible range)
    // So offsetX cannot be less than -maxX*scale.
    expect(clamped.offsetX).toBeGreaterThanOrEqual(-mapBounds.maxX * 10)
    expect(clamped.offsetY).toBeGreaterThanOrEqual(-mapBounds.maxY * 10)
  })
})

