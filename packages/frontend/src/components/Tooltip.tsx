import React from 'react'
import { Room, Zone } from '../types/map'
import { Translations, getRoomTypeName } from '../i18n/translations'
import { getRoomTypeIconComponent } from '../lib/iconRenderer'

interface TooltipProps {
  room: Room | null
  zone: Zone | null
  position: { x: number; y: number }
  visible: boolean
  t: Translations
}

export function Tooltip({ room, zone, position, visible, t }: TooltipProps) {
  if (!visible || !room) return null

  const Icon = getRoomTypeIconComponent(room.type)

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x + 15,
        top: position.y + 15,
        backgroundColor: 'rgba(20, 20, 30, 0.95)',
        border: '1px solid #444',
        borderRadius: 8,
        padding: '12px 16px',
        pointerEvents: 'none',
        zIndex: 1000,
        minWidth: 180,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#fff',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <Icon size={18} color="var(--accent-blue)" />
        <span>{room.name || `${t.room} ${room.id}`}</span>
      </div>

      <div style={{
        fontSize: 12,
        color: '#aaa',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '4px 12px'
      }}>
        <span style={{ color: '#888' }}>{t.type}:</span>
        <span style={{
          color: room.type === 'boss' ? '#ff6b6b' :
            room.type === 'save' ? '#4CAF50' :
              room.type === 'stag' ? '#2196F3' :
                room.type === 'start' ? '#FFD700' : '#ccc'
        }}>
          {getRoomTypeName(room.type, t)}
        </span>

        <span style={{ color: '#888' }}>{t.zone}:</span>
        <span style={{ color: zone?.color || '#ccc' }}>
          {zone?.name || `${t.zone} ${room.zone_id}`}
        </span>

        <span style={{ color: '#888' }}>{t.position}:</span>
        <span>({room.x}, {room.y})</span>

        <span style={{ color: '#888' }}>{t.size}:</span>
        <span>{room.w} × {room.h}</span>

        {room.depth !== undefined && (
          <>
            <span style={{ color: '#888' }}>{t.depth}:</span>
            <span>{room.depth}</span>
          </>
        )}

        {room.neighbors && room.neighbors.length > 0 && (
          <>
            <span style={{ color: '#888' }}>{t.connections}:</span>
            <span>{room.neighbors.length}</span>
          </>
        )}
      </div>
    </div>
  )
}
