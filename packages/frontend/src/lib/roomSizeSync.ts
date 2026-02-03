import type { Room } from '../types/map'
import { TILES_PER_CHUNK_X, TILES_PER_CHUNK_Y } from '../types/map'
import { resizeRoomDetail } from './roomDetailResize'

/**
 * 월드맵의 방 크기(w/h)가 바뀌면, 상세맵(RoomDetail) 타일 크기도 함께 동기화합니다.
 * - detail이 없으면 아무 것도 하지 않음
 * - tileWidth = w * TILES_PER_CHUNK_X
 * - tileHeight = h * TILES_PER_CHUNK_Y
 */
export function syncRoomDetailToRoomSize(room: Room): Room {
  if (!room.detail) return room

  const nextTileWidth = Math.max(1, room.w) * TILES_PER_CHUNK_X
  const nextTileHeight = Math.max(1, room.h) * TILES_PER_CHUNK_Y

  if (room.detail.tileWidth === nextTileWidth && room.detail.tileHeight === nextTileHeight) {
    return room
  }

  return {
    ...room,
    detail: resizeRoomDetail(room.detail, nextTileWidth, nextTileHeight, { fill: 'empty' }),
  }
}

