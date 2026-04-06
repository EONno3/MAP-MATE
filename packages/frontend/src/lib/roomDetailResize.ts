import type { RoomDetail, RoomLayer, RoomObject, TileType } from '../types/map'

function createTiles(tileWidth: number, tileHeight: number, fill: TileType): TileType[][] {
  return Array.from({ length: tileHeight }, () => Array.from({ length: tileWidth }, () => fill))
}

function ensureLayers(detail: RoomDetail, fill: TileType): RoomLayer[] {
  const layers = (detail as unknown as { layers?: RoomLayer[] }).layers
  if (Array.isArray(layers) && layers.length > 0) return layers

  const w = Math.max(1, Math.floor(detail.tileWidth ?? 1))
  const h = Math.max(1, Math.floor(detail.tileHeight ?? 1))
  const legacyTiles = (detail as unknown as { tiles?: TileType[][] }).tiles ?? createTiles(w, h, fill)
  const legacyObjects = (detail as unknown as { objects?: RoomObject[] }).objects ?? []

  const nextLayers: RoomLayer[] = [
    { id: 'base', name: 'Base', type: 'tile', visible: true, opacity: 1, tiles: legacyTiles },
  ]
  if (legacyObjects.length > 0) {
    nextLayers.push({ id: 'objects', name: 'Objects', type: 'object', visible: true, opacity: 1, objects: legacyObjects })
  }
  return nextLayers
}

function pickLegacyTiles(layers: RoomLayer[], w: number, h: number, fill: TileType): TileType[][] {
  const firstTileLayer = layers.find((l) => l?.type === 'tile' && l.tiles)
  if (firstTileLayer?.tiles) return firstTileLayer.tiles
  return createTiles(w, h, fill)
}

function collectLegacyObjects(layers: RoomLayer[]): RoomObject[] {
  const out: RoomObject[] = []
  for (const layer of layers) {
    if (layer?.type !== 'object') continue
    if (!layer.objects) continue
    out.push(...layer.objects)
  }
  return out
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

  const copyW = Math.min(w, detail.tileWidth)
  const copyH = Math.min(h, detail.tileHeight)

  const layers = ensureLayers(detail, fill)
  const nextLayers = layers.map(layer => {
    if (layer.type === 'tile') {
      const nextTiles = createTiles(w, h, fill)
      if (layer.tiles) {
        for (let y = 0; y < copyH; y++) {
          const row = layer.tiles[y] ?? []
          for (let x = 0; x < copyW; x++) {
            nextTiles[y][x] = (row[x] ?? fill) as TileType
          }
        }
      }
      return { ...layer, tiles: nextTiles }
    } else if (layer.type === 'object') {
      return {
        ...layer,
        objects: (layer.objects || []).filter((obj) => obj.x >= 0 && obj.y >= 0 && obj.x < w && obj.y < h)
      }
    }
    return layer
  })

  return {
    ...detail,
    tileWidth: w,
    tileHeight: h,
    layers: nextLayers,
    // legacy 호환: 단일 tiles/objects 필드도 함께 갱신
    tiles: pickLegacyTiles(nextLayers, w, h, fill),
    objects: collectLegacyObjects(nextLayers),
  }
}

