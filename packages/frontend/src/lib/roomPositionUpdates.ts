import type { MapData } from '../types/map'

export interface RoomPositionUpdate {
  id: number
  x: number
  y: number
}

export function applyRoomPositionUpdates(mapData: MapData, updates: RoomPositionUpdate[]): MapData {
  if (updates.length === 0) return mapData

  const byId = new Map<number, { x: number; y: number }>()
  for (const u of updates) byId.set(u.id, { x: u.x, y: u.y })

  let changed = false
  const nextRooms = mapData.rooms.map((room) => {
    const pos = byId.get(room.id)
    if (!pos) return room
    if (room.x === pos.x && room.y === pos.y) return room
    changed = true
    return { ...room, x: pos.x, y: pos.y }
  })

  if (!changed) return mapData
  return { ...mapData, rooms: nextRooms }
}

