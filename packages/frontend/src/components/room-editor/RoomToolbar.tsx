import React from 'react'
import { Translations } from '../../i18n/translations'
import { Room, Zone } from '../../types/map'

interface RoomToolbarProps {
  room: Room
  zone: Zone | null
  onBack: () => void
  onSave: () => void
  onReset: () => void
  t: Translations
}

export function RoomToolbar({ room, zone, onBack, onSave, onReset, t }: RoomToolbarProps) {
  return (
    <div style={{
      height: 50,
      backgroundColor: '#1a1a24',
      borderBottom: '1px solid #333',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12
    }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          backgroundColor: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        <span>←</span>
        {t.backToWorldMap}
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 30, backgroundColor: '#333' }} />

      {/* Room Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <div style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          backgroundColor: zone?.color || '#555'
        }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
          {room.name || `${t.room} ${room.id}`}
        </span>
        <span style={{ fontSize: 12, color: '#888' }}>
          ({room.w * 10} × {room.h * 6} {t.tiles})
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <button
        onClick={onReset}
        style={{
          padding: '8px 16px',
          backgroundColor: 'transparent',
          color: '#ff6b6b',
          border: '1px solid #8b0000',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        <span>🔄</span>
        {t.reset}
      </button>

      <button
        onClick={onSave}
        style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        <span>💾</span>
        {t.save}
      </button>
    </div>
  )
}




