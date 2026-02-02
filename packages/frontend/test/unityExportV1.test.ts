import { describe, expect, it } from 'vitest'
import type { MapData, Room, RoomDetail } from '../src/types/map'
import { buildUnityExportV1 } from '../src/lib/unityExportV1'

function decodeRle1d(rle: Array<{ id: number; run: number }>): number[] {
  const out: number[] = []
  for (const { id, run } of rle) {
    for (let i = 0; i < run; i++) out.push(id)
  }
  return out
}

describe('buildUnityExportV1', () => {
  it('detail이 없는 방도 export 시 자동 생성한다', () => {
    const rooms: Room[] = [
      { id: 1, x: 0, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
    ]
    const mapData: MapData = { width: 10, height: 10, zones: { 1: { name: 'Z', color: '#fff' } }, rooms }

    const out = buildUnityExportV1(mapData, [])
    expect(out.rooms[0].detail.tileWidth).toBe(10)
    expect(out.rooms[0].detail.tileHeight).toBe(6)
  })

  it('인접한 방 연결은 door로 export하고 doorway 좌표를 명시한다', () => {
    const makeDetail = (roomId: number): RoomDetail => ({
      roomId,
      tileWidth: 10,
      tileHeight: 6,
      tiles: Array.from({ length: 6 }, () => Array.from({ length: 10 }, () => 'empty' as const)),
      objects: [],
    })

    const r1: Room = { id: 1, x: 0, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [], detail: makeDetail(1) }
    const r2: Room = { id: 2, x: 1, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [], detail: makeDetail(2) }
    const mapData: MapData = { width: 10, height: 10, zones: { 1: { name: 'Z', color: '#fff' } }, rooms: [r1, r2] }

    const out = buildUnityExportV1(mapData, [{ fromId: 1, toId: 2, condition: 'none' }], { tilesEncoding: 'raw2d' })
    expect(out.connections[0].linkType).toBe('door')
    expect(out.connections[0].doorwayA).toBeTruthy()
    expect(out.connections[0].doorwayB).toBeTruthy()
    // r1 rightmost tile = 9, r2 leftmost = 10 (tilesPerChunkX=10)
    expect(out.connections[0].doorwayA!.worldTileX).toBe(9)
    expect(out.connections[0].doorwayB!.worldTileX).toBe(10)
  })

  it('비인접 방 연결은 portal로 export한다', () => {
    const rooms: Room[] = [
      { id: 1, x: 0, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
      { id: 2, x: 3, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
    ]
    const mapData: MapData = { width: 10, height: 10, zones: { 1: { name: 'Z', color: '#fff' } }, rooms }

    const out = buildUnityExportV1(mapData, [{ fromId: 1, toId: 2, condition: 'dash' }])
    expect(out.connections[0].linkType).toBe('portal')
    expect(out.connections[0].portalA).toBeTruthy()
    expect(out.connections[0].portalB).toBeTruthy()
  })

  it('rle1d 인코딩은 tileWidth*tileHeight 길이를 만족한다', () => {
    const room: Room = {
      id: 1,
      x: 0,
      y: 0,
      w: 5,
      h: 5,
      zone_id: 1,
      type: 'normal',
      rects: [[0, 0, 5, 5]],
      neighbors: [],
    }
    const mapData: MapData = { width: 100, height: 100, zones: { 1: { name: 'Z', color: '#fff' } }, rooms: [room] }

    const out = buildUnityExportV1(mapData, [], { tilesEncoding: 'rle1d' })
    expect(out.rooms[0].detail.tilesEncoding).toBe('rle1d')
    const rle = out.rooms[0].detail.tiles as Array<{ id: number; run: number }>
    const decoded = decodeRle1d(rle)
    expect(decoded.length).toBe(out.rooms[0].detail.tileWidth * out.rooms[0].detail.tileHeight)
  })
})

