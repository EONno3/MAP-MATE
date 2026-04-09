import type { Room, Zone } from '../types/map'
import type { Translations } from '../i18n/translations'
import { getRoomTypeName, translations } from '../i18n/translations'

export interface RoomNavigatorTooltipModel {
  title: string
  subtitle: string
  zoneName: string | null
  zoneColor: string | null
}

export function buildRoomNavigatorTooltip(params: {
  room: Room
  zones?: Record<number, Zone> | null
  t?: Translations
}): RoomNavigatorTooltipModel {
  const { room, zones, t = translations.ko } = params
  const zone = zones ? zones[room.zone_id] : undefined
  const zoneName = zone?.name ?? null
  const zoneColor = zone?.color ?? null

  const title = `방 #${room.id}${room.name ? ` · ${room.name}` : ''}`
  const typeName = getRoomTypeName(room.type, t)
  const subtitle = `${t.type}: ${typeName}${zoneName ? ` · ${t.zone}: ${zoneName}` : ''}`

  return { title, subtitle, zoneName, zoneColor }
}

