import { describe, expect, it } from 'vitest'
import type { MapData } from '../src/types/map'
import { applyConnectionsToRooms, normalizeConnections } from '../src/lib/mapConnections'

describe('mapConnections', () => {
  it('normalizeConnections는 (fromId,toId)를 정규화하고 중복을 제거한다', () => {
    const out = normalizeConnections([
      { fromId: 2, toId: 1, condition: 'none' },
      { fromId: 1, toId: 2, condition: 'dash' }, // duplicate, later wins
      { fromId: 3, toId: 2, condition: 'none' },
    ])

    expect(out).toEqual([
      { fromId: 1, toId: 2, condition: 'dash' },
      { fromId: 2, toId: 3, condition: 'none' },
    ])
  })

  it('applyConnectionsToRooms는 rooms.neighbors를 connections로부터 동기화한다', () => {
    const mapData: MapData = {
      width: 10,
      height: 10,
      zones: { 1: { name: 'Z1', color: '#fff' } },
      rooms: [
        { id: 1, x: 0, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
        { id: 2, x: 2, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
        { id: 3, x: 4, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
      ],
    }

    const next = applyConnectionsToRooms(mapData, [
      { fromId: 2, toId: 1, condition: 'none' },
      { fromId: 2, toId: 3, condition: 'none' },
    ])

    const byId = new Map(next.rooms.map((r) => [r.id, r]))
    expect(byId.get(1)!.neighbors).toEqual([2])
    expect(byId.get(2)!.neighbors).toEqual([1, 3])
    expect(byId.get(3)!.neighbors).toEqual([2])
  })
})

