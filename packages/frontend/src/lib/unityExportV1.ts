import type { Connection, MapData, Room, RoomDetail, TileType } from '../types/map'
import { TILES_PER_CHUNK_X, TILES_PER_CHUNK_Y, UNITY_COMPONENT_MAP } from '../types/map'
import { resizeRoomDetail } from './roomDetailResize'
import { normalizeConnections } from './mapConnections'

export type UnityFacing = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
export type UnityLinkType = 'door' | 'portal'

export interface UnityTilePaletteEntry {
  id: number
  key: TileType
}

export interface UnityObjectPaletteEntry {
  key: string
  prefabKey: string
}

export interface UnityDoorway {
  roomId: number
  worldTileX: number
  worldTileY: number
  facing: UnityFacing
}

export interface UnityComponentExport {
  type: string
  properties?: Record<string, any>
}

export interface UnityEntityExport {
  key: string
  x: number
  y: number
  layer?: string
  tag?: string
  components?: UnityComponentExport[]
  properties?: Record<string, unknown>
}

export interface UnityTilemapLayerExport {
  name: string
  sortingOrder: number
  layer?: string
  tag?: string
  tilesEncoding: 'raw2d' | 'rle1d'
  tiles: number[][] | Array<{ id: number; run: number }>
}

export interface UnityRoomExport {
  id: number
  zoneId: number
  roomGrid: { x: number; y: number; w: number; h: number }
  worldTileOrigin: { x: number; y: number }
  detail: {
    tileWidth: number
    tileHeight: number
    gridSize: number
    tileLayers: UnityTilemapLayerExport[]
    objects: UnityEntityExport[]
  }
}

export interface UnityConnectionExport {
  fromId: number
  toId: number
  condition: string
  linkType: UnityLinkType
  doorwayA?: UnityDoorway
  doorwayB?: UnityDoorway
  portalA?: UnityDoorway
  portalB?: UnityDoorway
}

export interface UnityExportV1 {
  schemaVersion: 'mapmate.unity/v1'
  exportedAt: string
  tilesPerChunkX: number
  tilesPerChunkY: number
  tilePalette: { byId: UnityTilePaletteEntry[] }
  objectPalette: { byKey: UnityObjectPaletteEntry[] }
  rooms: UnityRoomExport[]
  connections: UnityConnectionExport[]
}

const TILE_TYPE_TO_ID: Record<TileType, number> = {
  empty: 0,
  solid: 1,
  platform: 2,
  spike: 3,
  acid: 4,
  breakable: 5,
  door: 6,
}

const TILE_PALETTE: UnityTilePaletteEntry[] = (Object.keys(TILE_TYPE_TO_ID) as TileType[]).map((key) => ({
  id: TILE_TYPE_TO_ID[key],
  key,
}))

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.floor(n)))
}

function defaultRoomDetail(room: Room, tilesPerChunkX: number, tilesPerChunkY: number): RoomDetail {
  const tileWidth = Math.max(1, room.w) * tilesPerChunkX
  const tileHeight = Math.max(1, room.h) * tilesPerChunkY

  const tiles: TileType[][] = Array.from({ length: tileHeight }, (_, y) =>
    Array.from({ length: tileWidth }, (_, x) => {
      if (y === 0 || y === tileHeight - 1) return 'solid'
      if (x === 0 || x === tileWidth - 1) return 'solid'
      if (y === tileHeight - 2) return 'solid'
      return 'empty'
    })
  )

  return {
    roomId: room.id,
    tileWidth,
    tileHeight,
    gridSize: 16,
    layers: [{ id: 'base', name: 'Base', type: 'tile', visible: true, opacity: 1, tiles }]
  }
}

function ensureDetailMatchesRoom(room: Room, tilesPerChunkX: number, tilesPerChunkY: number): RoomDetail {
  const expectedW = Math.max(1, room.w) * tilesPerChunkX
  const expectedH = Math.max(1, room.h) * tilesPerChunkY

  const detail = room.detail ?? defaultRoomDetail(room, tilesPerChunkX, tilesPerChunkY)
  if (detail.tileWidth === expectedW && detail.tileHeight === expectedH) return detail

  return resizeRoomDetail(detail, expectedW, expectedH, { fill: 'empty' })
}

function tilesToIdsRaw2d(tiles: TileType[][]): number[][] {
  return tiles.map((row) => row.map((t) => TILE_TYPE_TO_ID[t] ?? 0))
}

function tilesToIdsRle1d(tiles: TileType[][], w: number, h: number): Array<{ id: number; run: number }> {
  const flat: number[] = []
  for (let y = 0; y < h; y++) {
    const row = tiles[y] ?? []
    for (let x = 0; x < w; x++) {
      const t = (row[x] ?? 'empty') as TileType
      flat.push(TILE_TYPE_TO_ID[t] ?? 0)
    }
  }

  const out: Array<{ id: number; run: number }> = []
  if (flat.length === 0) return out

  let cur = flat[0]
  let run = 0
  for (const v of flat) {
    if (v === cur) {
      run++
    } else {
      out.push({ id: cur, run })
      cur = v
      run = 1
    }
  }
  if (run > 0) out.push({ id: cur, run })
  return out
}

function roomWorldTileOrigin(room: Room, tilesPerChunkX: number, tilesPerChunkY: number): { x: number; y: number } {
  return {
    x: room.x * tilesPerChunkX,
    y: room.y * tilesPerChunkY,
  }
}

function centerFacing(from: Room, to: Room): UnityFacing {
  const fromCx = from.x + from.w / 2
  const fromCy = from.y + from.h / 2
  const toCx = to.x + to.w / 2
  const toCy = to.y + to.h / 2
  const dx = toCx - fromCx
  const dy = toCy - fromCy
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'RIGHT' : 'LEFT'
  return dy >= 0 ? 'DOWN' : 'UP'
}

function oppositeFacing(f: UnityFacing): UnityFacing {
  if (f === 'LEFT') return 'RIGHT'
  if (f === 'RIGHT') return 'LEFT'
  if (f === 'UP') return 'DOWN'
  return 'UP'
}

function computeDoorway(roomA: Room, detailA: RoomDetail, roomB: Room, detailB: RoomDetail, tilesPerChunkX: number, tilesPerChunkY: number):
  | { linkType: 'door'; a: UnityDoorway; b: UnityDoorway }
  | { linkType: 'portal'; a: UnityDoorway; b: UnityDoorway } {
  const a0x = roomA.x
  const a1x = roomA.x + roomA.w - 1
  const a0y = roomA.y
  const a1y = roomA.y + roomA.h - 1

  const b0x = roomB.x
  const b1x = roomB.x + roomB.w - 1
  const b0y = roomB.y
  const b1y = roomB.y + roomB.h - 1

  const aOrigin = roomWorldTileOrigin(roomA, tilesPerChunkX, tilesPerChunkY)
  const bOrigin = roomWorldTileOrigin(roomB, tilesPerChunkX, tilesPerChunkY)

  // Horizontal adjacency
  if (a1x + 1 === b0x || b1x + 1 === a0x) {
    const overlapStart = Math.max(a0y, b0y)
    const overlapEnd = Math.min(a1y, b1y)
    if (overlapStart <= overlapEnd) {
      const tileStartY = overlapStart * tilesPerChunkY
      const tileEndY = (overlapEnd + 1) * tilesPerChunkY - 1
      const midY = Math.floor((tileStartY + tileEndY) / 2)

      const aToBRight = a1x + 1 === b0x
      const leftRoom = aToBRight ? roomA : roomB
      const rightRoom = aToBRight ? roomB : roomA
      const leftDetail = aToBRight ? detailA : detailB
      const rightDetail = aToBRight ? detailB : detailA
      const leftOrigin = aToBRight ? aOrigin : bOrigin
      const rightOrigin = aToBRight ? bOrigin : aOrigin

      const leftDoor: UnityDoorway = {
        roomId: leftRoom.id,
        worldTileX: leftOrigin.x + leftDetail.tileWidth - 1,
        worldTileY: midY,
        facing: 'RIGHT',
      }
      const rightDoor: UnityDoorway = {
        roomId: rightRoom.id,
        worldTileX: rightOrigin.x,
        worldTileY: midY,
        facing: 'LEFT',
      }

      return aToBRight ? { linkType: 'door', a: leftDoor, b: rightDoor } : { linkType: 'door', a: rightDoor, b: leftDoor }
    }
  }

  // Vertical adjacency
  if (a1y + 1 === b0y || b1y + 1 === a0y) {
    const overlapStart = Math.max(a0x, b0x)
    const overlapEnd = Math.min(a1x, b1x)
    if (overlapStart <= overlapEnd) {
      const tileStartX = overlapStart * tilesPerChunkX
      const tileEndX = (overlapEnd + 1) * tilesPerChunkX - 1
      const midX = Math.floor((tileStartX + tileEndX) / 2)

      const aToBBottom = a1y + 1 === b0y
      const topRoom = aToBBottom ? roomA : roomB
      const bottomRoom = aToBBottom ? roomB : roomA
      const topDetail = aToBBottom ? detailA : detailB
      const bottomDetail = aToBBottom ? detailB : detailA
      const topOrigin = aToBBottom ? aOrigin : bOrigin
      const bottomOrigin = aToBBottom ? bOrigin : aOrigin

      const topDoor: UnityDoorway = {
        roomId: topRoom.id,
        worldTileX: midX,
        worldTileY: topOrigin.y + topDetail.tileHeight - 1,
        facing: 'DOWN',
      }
      const bottomDoor: UnityDoorway = {
        roomId: bottomRoom.id,
        worldTileX: midX,
        worldTileY: bottomOrigin.y,
        facing: 'UP',
      }

      return aToBBottom ? { linkType: 'door', a: topDoor, b: bottomDoor } : { linkType: 'door', a: bottomDoor, b: topDoor }
    }
  }

  // Fallback: portal at room centers
  const aFacing = centerFacing(roomA, roomB)
  const bFacing = oppositeFacing(aFacing)
  const aPortal: UnityDoorway = {
    roomId: roomA.id,
    worldTileX: aOrigin.x + clampInt(detailA.tileWidth / 2, 0, detailA.tileWidth - 1),
    worldTileY: aOrigin.y + clampInt(detailA.tileHeight / 2, 0, detailA.tileHeight - 1),
    facing: aFacing,
  }
  const bPortal: UnityDoorway = {
    roomId: roomB.id,
    worldTileX: bOrigin.x + clampInt(detailB.tileWidth / 2, 0, detailB.tileWidth - 1),
    worldTileY: bOrigin.y + clampInt(detailB.tileHeight / 2, 0, detailB.tileHeight - 1),
    facing: bFacing,
  }
  return { linkType: 'portal', a: aPortal, b: bPortal }
}

export interface BuildUnityExportOptions {
  tilesPerChunkX?: number
  tilesPerChunkY?: number
  tilesEncoding?: 'auto' | 'raw2d' | 'rle1d'
}

export function buildUnityExportV1(mapData: MapData, connections: Connection[], options: BuildUnityExportOptions = {}): UnityExportV1 {
  const tilesPerChunkX = options.tilesPerChunkX ?? TILES_PER_CHUNK_X
  const tilesPerChunkY = options.tilesPerChunkY ?? TILES_PER_CHUNK_Y
  const encodingMode = options.tilesEncoding ?? 'auto'

  const roomsById = new Map<number, Room>(mapData.rooms.map((r) => [r.id, r]))

  // object palette는 현재 맵에 등장하는 타입만 수집
  const objectKeys = new Set<string>()

  const rooms: UnityRoomExport[] = mapData.rooms.map((room) => {
    const detail = ensureDetailMatchesRoom(room, tilesPerChunkX, tilesPerChunkY)
    const worldOrigin = roomWorldTileOrigin(room, tilesPerChunkX, tilesPerChunkY)

    const useRle = encodingMode === 'rle1d' || (encodingMode === 'auto' && detail.tileWidth * detail.tileHeight > 2000)
    const tilesEncoding: 'raw2d' | 'rle1d' = useRle ? 'rle1d' : 'raw2d'

    const tileLayers: UnityTilemapLayerExport[] = []
    const exportedObjects: UnityEntityExport[] = []

    let sortingOrder = 0
    for (const layer of detail.layers) {
      if (layer.type === 'tile' && layer.tiles) {
        const tiles = useRle ? tilesToIdsRle1d(layer.tiles, detail.tileWidth, detail.tileHeight) : tilesToIdsRaw2d(layer.tiles)
        tileLayers.push({
          name: layer.name,
          sortingOrder: sortingOrder++,
          layer: 'Default',
          tag: 'Untagged',
          tilesEncoding,
          tiles
        })
      } else if (layer.type === 'object' && layer.objects) {
        for (const obj of layer.objects) {
          objectKeys.add(obj.type)

          let layerName = 'Default'
          let unityTag = 'Untagged'
          const components: UnityComponentExport[] = []

          if (obj.tags && obj.tags.length > 0) {
            for (const t of obj.tags) {
              const mapping = UNITY_COMPONENT_MAP[t]
              if (mapping) {
                if (mapping.layer) layerName = mapping.layer
                if (mapping.tag) unityTag = mapping.tag
                if (mapping.components) {
                  for (const c of mapping.components) {
                    components.push({
                      type: c.type,
                      properties: { ...c.properties, ...(obj.tagData?.[t] || {}) }
                    })
                  }
                }
              }
            }
          }

          exportedObjects.push({
            key: obj.type,
            x: obj.x,
            y: obj.y,
            layer: layerName,
            tag: unityTag,
            components,
            properties: obj.properties // legacy
          })
        }
      }
    }

    return {
      id: room.id,
      zoneId: room.zone_id,
      roomGrid: { x: room.x, y: room.y, w: room.w, h: room.h },
      worldTileOrigin: worldOrigin,
      detail: {
        tileWidth: detail.tileWidth,
        tileHeight: detail.tileHeight,
        gridSize: detail.gridSize ?? 16,
        tileLayers,
        objects: exportedObjects,
      },
    }
  })

  const objectPalette: UnityObjectPaletteEntry[] = Array.from(objectKeys).sort().map((key) => ({
    key,
    prefabKey: key, // Unity에서 key->Prefab 매핑 에셋으로 연결
  }))

  const normalizedConnections = normalizeConnections(connections)
  const exportedConnections: UnityConnectionExport[] = normalizedConnections
    .map((c) => {
      const from = roomsById.get(c.fromId)
      const to = roomsById.get(c.toId)
      if (!from || !to) return null

      const fromDetail = ensureDetailMatchesRoom(from, tilesPerChunkX, tilesPerChunkY)
      const toDetail = ensureDetailMatchesRoom(to, tilesPerChunkX, tilesPerChunkY)
      const link = computeDoorway(from, fromDetail, to, toDetail, tilesPerChunkX, tilesPerChunkY)

      if (link.linkType === 'door') {
        return {
          fromId: from.id,
          toId: to.id,
          condition: c.condition,
          linkType: 'door',
          doorwayA: link.a,
          doorwayB: link.b,
        }
      }
      return {
        fromId: from.id,
        toId: to.id,
        condition: c.condition,
        linkType: 'portal',
        portalA: link.a,
        portalB: link.b,
      }
    })
    .filter(Boolean) as UnityConnectionExport[]

  return {
    schemaVersion: 'mapmate.unity/v1',
    exportedAt: new Date().toISOString(),
    tilesPerChunkX,
    tilesPerChunkY,
    tilePalette: { byId: TILE_PALETTE },
    objectPalette: { byKey: objectPalette },
    rooms,
    connections: exportedConnections,
  }
}

