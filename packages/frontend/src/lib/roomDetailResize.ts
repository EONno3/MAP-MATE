import type { RoomDetail, TileType } from '../types/map'

function createTiles(tileWidth: number, tileHeight: number, fill: TileType): TileType[][] {
  return Array.from({ length: tileHeight }, () => Array.from({ length: tileWidth }, () => fill))
}

export interface ResizeRoomDetailOptions {
  /**
   * 새로 생기는 영역을 채울 타일 타입.
   * 기본은 'empty'
   */
  fill?: TileType
}

/**
 * RoomDetail의 타일 그리드를 새 크기로 리사이즈합니다.
 * - 좌상단(0,0) 기준으로 겹치는 영역은 그대로 복사
 * - 새로 생기는 영역은 fill 타일로 채움
 * - 범위를 벗어난 오브젝트는 제거
 */
export function resizeRoomDetail(
  detail: RoomDetail,
  nextTileWidth: number,
  nextTileHeight: number,
  options: ResizeRoomDetailOptions = {}
): RoomDetail {
  const fill: TileType = options.fill ?? 'empty'

  const w = Math.max(1, Math.floor(nextTileWidth))
  const h = Math.max(1, Math.floor(nextTileHeight))

  const nextTiles = createTiles(w, h, fill)

  const copyW = Math.min(w, detail.tileWidth)
  const copyH = Math.min(h, detail.tileHeight)

  for (let y = 0; y < copyH; y++) {
    const row = detail.tiles[y] ?? []
    for (let x = 0; x < copyW; x++) {
      nextTiles[y][x] = (row[x] ?? fill) as TileType
    }
  }

  const nextObjects = detail.objects.filter((obj) => obj.x >= 0 && obj.y >= 0 && obj.x < w && obj.y < h)

  return {
    ...detail,
    tileWidth: w,
    tileHeight: h,
    tiles: nextTiles,
    objects: nextObjects,
  }
}

