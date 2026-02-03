import { describe, expect, it } from 'vitest'
import { parseImportedMapJson } from '../src/lib/mapSerialization'

describe('parseImportedMapJson', () => {
  it('connections가 있는 포맷은 connections를 그대로 사용한다', () => {
    const json = JSON.stringify({
      width: 10,
      height: 10,
      rooms: [
        { id: 1, x: 0, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
        { id: 2, x: 1, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
      ],
      zones: { 1: { name: 'Z', color: '#fff' } },
      connections: [{ fromId: 1, toId: 2, condition: 'dash' }],
    })

    const parsed = parseImportedMapJson(json)
    expect(parsed.connections).toEqual([{ fromId: 1, toId: 2, condition: 'dash' }])
    const room1 = parsed.mapData.rooms.find((r) => r.id === 1)!
    expect(room1.neighbors).toEqual([2])
  })

  it('connections가 없으면 neighbors로부터 폴백 생성한다', () => {
    const json = JSON.stringify({
      width: 10,
      height: 10,
      rooms: [
        { id: 1, x: 0, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [2] },
        { id: 2, x: 1, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [1] },
      ],
      zones: { 1: { name: 'Z', color: '#fff' } },
    })

    const parsed = parseImportedMapJson(json)
    expect(parsed.connections).toEqual([{ fromId: 1, toId: 2, condition: 'none' }])
  })

  it('tileCatalog이 있으면 함께 파싱한다', () => {
    const json = JSON.stringify({
      width: 10,
      height: 10,
      rooms: [
        { id: 1, x: 0, y: 0, w: 1, h: 1, zone_id: 1, type: 'normal', rects: [[0, 0, 1, 1]], neighbors: [] },
      ],
      zones: { 1: { name: 'Z', color: '#fff' } },
      tileCatalog: {
        version: 1,
        customKeys: ['custom_a'],
        overrides: { custom_a: { color: '#123456', name: { ko: '커스텀', en: 'Custom' } } },
      },
    })

    const parsed = parseImportedMapJson(json)
    expect(parsed.tileCatalog?.version).toBe(1)
    expect(parsed.tileCatalog?.customKeys).toEqual(['custom_a'])
    expect(parsed.tileCatalog?.overrides.custom_a.color).toBe('#123456')
  })
})

