import { describe, expect, it } from 'vitest'
import type { RoomDetail } from '../src/types/map'
import { resizeRoomDetail } from '../src/lib/roomDetailResize'

describe('resizeRoomDetail', () => {
  it('확장 시 기존 영역을 보존하고 나머지는 fill로 채운다', () => {
    const detail: RoomDetail = {
      roomId: 1,
      tileWidth: 2,
      tileHeight: 2,
      tiles: [
        ['solid', 'platform'],
        ['empty', 'spike'],
      ],
      objects: [{ id: 'o1', type: 'npc', x: 1, y: 1 }],
    }

    const next = resizeRoomDetail(detail, 4, 3, { fill: 'empty' })

    expect(next.tileWidth).toBe(4)
    expect(next.tileHeight).toBe(3)
    expect(next.tiles[0].slice(0, 2)).toEqual(['solid', 'platform'])
    expect(next.tiles[1].slice(0, 2)).toEqual(['empty', 'spike'])
    expect(next.tiles[2]).toEqual(['empty', 'empty', 'empty', 'empty'])
    expect(next.objects).toEqual([{ id: 'o1', type: 'npc', x: 1, y: 1 }])
  })

  it('축소 시 범위를 벗어난 오브젝트는 제거한다', () => {
    const detail: RoomDetail = {
      roomId: 1,
      tileWidth: 4,
      tileHeight: 4,
      tiles: Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 'empty' as const)),
      objects: [
        { id: 'in', type: 'npc', x: 1, y: 1 },
        { id: 'out', type: 'npc', x: 3, y: 3 },
      ],
    }

    const next = resizeRoomDetail(detail, 2, 2)
    expect(next.tileWidth).toBe(2)
    expect(next.tileHeight).toBe(2)
    expect(next.objects.map((o) => o.id)).toEqual(['in'])
  })
})

