import type { Connection, MapData, Room } from '../types/map'

function connectionKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function normalizeConnections(connections: Connection[]): Connection[] {
  const byKey = new Map<string, Connection>()
  for (const c of connections) {
    const fromId = Math.min(c.fromId, c.toId)
    const toId = Math.max(c.fromId, c.toId)
    const key = connectionKey(fromId, toId)

    // 중복이 있으면 "마지막"을 우선 (사용자 편집 흐름에서 최신을 우선)
    byKey.set(key, { ...c, fromId, toId })
  }
  return Array.from(byKey.values())
}

export function deriveNeighborsByRoomId(roomIds: number[], connections: Connection[]): Record<number, number[]> {
  const neighborSets = new Map<number, Set<number>>()
  for (const id of roomIds) neighborSets.set(id, new Set<number>())

  for (const c of connections) {
    if (!neighborSets.has(c.fromId) || !neighborSets.has(c.toId)) continue
    neighborSets.get(c.fromId)!.add(c.toId)
    neighborSets.get(c.toId)!.add(c.fromId)
  }

  const result: Record<number, number[]> = {}
  for (const [id, set] of neighborSets.entries()) {
    result[id] = Array.from(set).sort((a, b) => a - b)
  }
  return result
}

export function applyConnectionsToRooms(mapData: MapData, connections: Connection[]): MapData {
  const normalized = normalizeConnections(connections)
  const ids = mapData.rooms.map((r) => r.id)
  const neighbors = deriveNeighborsByRoomId(ids, normalized)

  const nextRooms: Room[] = mapData.rooms.map((room) => ({
    ...room,
    neighbors: neighbors[room.id] ?? [],
  }))

  return { ...mapData, rooms: nextRooms, connections: normalized }
}

