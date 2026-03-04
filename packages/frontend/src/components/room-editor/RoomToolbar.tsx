import React from 'react'
import { Translations } from '../../i18n/translations'
import { Room, Zone } from '../../types/map'
import { ArrowLeft, RotateCcw, Save } from 'lucide-react'

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
    <div className="panel-base" style={{
      height: 56,
      borderRadius: 0,
      borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 16,
      zIndex: 'var(--z-panel)'
    }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="btn-base btn-secondary"
      >
        <ArrowLeft size={16} />
        {t.backToWorldMap}
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-light)' }} />

      {/* Room Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          backgroundColor: zone?.color || '#555',
          boxShadow: 'var(--shadow-sm)'
        }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
          {room.name || `${t.room} ${room.id}`}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          ({room.w * 10} × {room.h * 6} {t.tiles})
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onReset}
          className="btn-base btn-danger"
          style={{ padding: '8px 16px' }}
        >
          <RotateCcw size={16} />
          {t.reset}
        </button>

        <button
          onClick={onSave}
          className="btn-base btn-primary"
        >
          <Save size={16} />
          {t.save}
        </button>
      </div>
    </div>
  )
}
