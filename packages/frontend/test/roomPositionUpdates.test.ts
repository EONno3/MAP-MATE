import { describe, expect, it } from 'vitest'
import type { MapData } from '../src/types/map'
import { applyRoomPositionUpdates } from '../src/lib/roomPositionUpdates'

describe('applyRoomPositionUpdates', () => {
  it('지정된 방들만 x/y를 일괄 업데이트한다', () => {
    const mapData: MapData = {
      width: 10,
      height: 10,
      zones: { 1: { name: 'z', color: '#000' } },
      rooms: [
        { id: 1, x: 0, y: 0, w: 2, h: 2, zone_id: 1, type: 'normal', rects: [[0, 0, 2, 2]], neighbors: [] },
        { id: 2, x: 5, y: 5, w: 2, h: 2, zone_id: 1, type: 'normal', rects: [[0, 0, 2, 2]], neighbors: [] },
      ],
    }

    const next = applyRoomPositionUpdates(mapData, [
      { id: 1, x: 3, y: 4 },
    ])

    expect(next.rooms.find((r) => r.id === 1)!.x).toBe(3)
    expect(next.rooms.find((r) => r.id === 1)!.y).toBe(4)
    expect(next.rooms.find((r) => r.id === 2)!.x).toBe(5)
    expect(next.rooms.find((r) => r.id === 2)!.y).toBe(5)
  })

  it('변경이 없으면 같은 mapData를 반환한다(불필요한 렌더 방지)', () => {
    const mapData: MapData = {
      width: 10,
      height: 10,
      zones: { 1: { name: 'z', color: '#000' } },
      rooms: [
        { id: 1, x: 0, y: 0, w: 2, h: 2, zone_id: 1, type: 'normal', rects: [[0, 0, 2, 2]], neighbors: [] },
      ],
    }

    const next = applyRoomPositionUpdates(mapData, [{ id: 1, x: 0, y: 0 }])
    expect(next).toBe(mapData)
  })
})

