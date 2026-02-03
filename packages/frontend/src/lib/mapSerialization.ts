import type { Connection, MapData, Room } from '../types/map'
import { applyConnectionsToRooms, normalizeConnections } from './mapConnections'
import type { TileCatalogStateV1 } from './tileCatalogState'
import { normalizeTileCatalogState } from './tileCatalogState'

export interface ImportedMap {
  mapData: MapData
  connections: Connection[]
  tileCatalog?: TileCatalogStateV1
}

type UnknownRecord = Record<string, unknown>

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function hasRoomsAndZones(v: UnknownRecord): v is UnknownRecord & { rooms: unknown; zones: unknown } {
  return 'rooms' in v && 'zones' in v
}

function normalizeRoom(room: unknown): Room | null {
  if (!isRecord(room)) return null
  const id = asNumber(room.id, NaN)
  if (!Number.isFinite(id)) return null

  const x = asNumber(room.x, 0)
  const y = asNumber(room.y, 0)
  const w = asNumber(room.w, 1)
  const h = asNumber(room.h, 1)
  const zone_id = asNumber(room.zone_id, 1)

  const type = (typeof room.type === 'string' ? room.type : 'normal') as Room['type']

  const rects = Array.isArray(room.rects) ? (room.rects as any) : [[0, 0, w, h]]
  const neighbors = Array.isArray(room.neighbors) ? (room.neighbors as any).filter((n: any) => typeof n === 'number') : []

  return {
    id,
    x,
    y,
    w,
    h,
    zone_id,
    type,
    rects,
    neighbors,
    name: typeof room.name === 'string' ? room.name : undefined,
    depth: typeof room.depth === 'number' ? room.depth : undefined,
    detail: isRecord(room.detail) ? (room.detail as any) : undefined,
  }
}

function normalizeConnectionsFromUnknown(v: unknown): Connection[] {
  if (!Array.isArray(v)) return []
  const raw = v
    .map((c) => {
      if (!isRecord(c)) return null
      const fromId = asNumber(c.fromId, NaN)
      const toId = asNumber(c.toId, NaN)
      if (!Number.isFinite(fromId) || !Number.isFinite(toId)) return null
      const condition = (typeof c.condition === 'string' ? c.condition : 'none') as Connection['condition']
      return { fromId, toId, condition }
    })
    .filter(Boolean) as Connection[]
  return normalizeConnections(raw)
}

export function parseImportedMapJson(json: string): ImportedMap {
  const parsed = JSON.parse(json) as unknown
  if (!isRecord(parsed)) {
    throw new Error('Invalid JSON format (root is not an object)')
  }

  // (A) 우리가 내보낸 포맷(루트에 rooms/zones/connections가 있는 경우)
  // (B) 혹시 mapData 필드를 두는 확장 포맷도 허용
  const root: UnknownRecord = parsed
  const maybeMapData = (isRecord(root.mapData) ? (root.mapData as UnknownRecord) : null) ?? root

  if (!isRecord(maybeMapData) || !hasRoomsAndZones(maybeMapData)) {
    throw new Error('Invalid map format (rooms/zones missing)')
  }

  const roomsRaw = Array.isArray(maybeMapData.rooms) ? maybeMapData.rooms : []
  const rooms: Room[] = roomsRaw.map(normalizeRoom).filter(Boolean) as Room[]

  const zones = isRecord(maybeMapData.zones) ? (maybeMapData.zones as any) : {}
  const width = asNumber(maybeMapData.width, 50)
  const height = asNumber(maybeMapData.height, 50)

  const mapData: MapData = { width, height, rooms, zones }

  // connections는 우선순위: root.connections > mapData.connections > (neighbors로부터 생성)
  const rawConnections =
    normalizeConnectionsFromUnknown(root.connections) ||
    normalizeConnectionsFromUnknown((maybeMapData as any).connections)

  const connections =
    rawConnections.length > 0
      ? rawConnections
      : // neighbors 기반 폴백
        rooms.flatMap((r) => (r.neighbors ?? []).map((n) => ({ fromId: r.id, toId: n, condition: 'none' as const })))

  const normalizedConnections = normalizeConnections(connections)
  const normalizedMapData = applyConnectionsToRooms(mapData, normalizedConnections)

  const tileCatalog = 'tileCatalog' in root ? normalizeTileCatalogState((root as any).tileCatalog) : undefined
  return { mapData: normalizedMapData, connections: normalizedConnections, tileCatalog }
}

