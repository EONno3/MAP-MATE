import { describe, expect, it } from 'vitest'
import type { Room } from '../src/types/map'
import { buildRoomNavigatorTooltip } from '../src/lib/roomNavigatorTooltip'

describe('buildRoomNavigatorTooltip', () => {
  it('zone/name이 없으면 최소 정보만 포함한다', () => {
    const room: Room = {
      id: 1,
      x: 0, y: 0, w: 1, h: 1,
      zone_id: 99,
      type: 'normal',
      rects: [[0, 0, 1, 1]],
      neighbors: [],
    }

    const out = buildRoomNavigatorTooltip({ room, zones: null })
    expect(out.title).toBe('방 #1')
    expect(out.subtitle).toBe('유형: 일반')
    expect(out.zoneName).toBe(null)
    expect(out.zoneColor).toBe(null)
  })

  it('zone/name이 있으면 title/subtitle에 포함한다', () => {
    const room: Room = {
      id: 7,
      x: 0, y: 0, w: 1, h: 1,
      zone_id: 1,
      type: 'boss',
      rects: [[0, 0, 1, 1]],
      neighbors: [],
      name: '보스방',
    }

    const out = buildRoomNavigatorTooltip({
      room,
      zones: { 1: { name: 'A구역', color: '#ff00ff' } },
    })

    expect(out.title).toBe('방 #7 · 보스방')
    expect(out.subtitle).toBe('유형: 보스 · 구역: A구역')
    expect(out.zoneName).toBe('A구역')
    expect(out.zoneColor).toBe('#ff00ff')
  })
})

