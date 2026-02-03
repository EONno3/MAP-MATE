import { describe, expect, it } from 'vitest'
import type { Room } from '../src/types/map'
import { syncRoomDetailToRoomSize } from '../src/lib/roomSizeSync'
import { TILES_PER_CHUNK_X, TILES_PER_CHUNK_Y } from '../src/types/map'

describe('syncRoomDetailToRoomSize', () => {
  it('room.w/h 변경에 맞춰 detail.tileWidth/tileHeight를 동기화한다', () => {
    const room: Room = {
      id: 1,
      x: 0,
      y: 0,
      w: 2,
      h: 1,
      zone_id: 1,
      type: 'normal',
      rects: [[0, 0, 2, 1]],
      neighbors: [],
      detail: {
        roomId: 1,
        tileWidth: 5,
        tileHeight: 5,
        tiles: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 'empty' as const)),
        objects: [],
      },
    }

    const next = syncRoomDetailToRoomSize(room)
    expect(next.detail!.tileWidth).toBe(2 * TILES_PER_CHUNK_X)
    expect(next.detail!.tileHeight).toBe(1 * TILES_PER_CHUNK_Y)
  })
})

