import React, { useState, useCallback } from 'react'
import { Zone } from '../types/map'
import { Translations } from '../i18n/translations'
import { Palette, X, Trash2, Plus } from 'lucide-react'

// 기본 색상 팔레트
const DEFAULT_COLORS = [
  '#4a90d9', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#3498db', '#e91e63', '#00bcd4',
  '#8bc34a', '#ff5722', '#607d8b', '#795548', '#ffc107'
]

interface ZonePanelProps {
  zones: Record<number, Zone>
  onAddZone: (zone: Zone) => number
  onUpdateZone: (id: number, updates: Partial<Zone>) => void
  onDeleteZone: (id: number) => void
  collapsed: boolean
  onToggle: () => void
  t: Translations
}

export function ZonePanel({
  zones,
  onAddZone,
  onUpdateZone,
  onDeleteZone,
  collapsed,
  onToggle,
  t
}: ZonePanelProps) {
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null)
  const [newZoneName, setNewZoneName] = useState('')

  const zoneEntries = Object.entries(zones)
  const zoneCount = zoneEntries.length

  // 다음 기본 색상 선택
  const getNextDefaultColor = useCallback(() => {
    const usedColors = new Set(Object.values(zones).map(z => z.color.toLowerCase()))
    const available = DEFAULT_COLORS.find(c => !usedColors.has(c.toLowerCase()))
    return available || DEFAULT_COLORS[zoneCount % DEFAULT_COLORS.length]
  }, [zones, zoneCount])

  // 새 Zone 추가
  const handleAddZone = useCallback(() => {
    const name = newZoneName.trim() || `${t.newZone} ${zoneCount + 1}`
    onAddZone({
      name,
      color: getNextDefaultColor()
    })
    setNewZoneName('')
  }, [newZoneName, zoneCount, onAddZone, getNextDefaultColor, t.newZone])

  // Zone 삭제
  const handleDeleteZone = useCallback((id: number) => {
    if (zoneCount <= 1) {
      alert(t.cannotDeleteLastZone)
      return
    }
    if (confirm(t.confirmDeleteZone)) {
      onDeleteZone(id)
    }
  }, [zoneCount, onDeleteZone, t])

  // 색상 변경
  const handleColorChange = useCallback((id: number, color: string) => {
    onUpdateZone(id, { color })
  }, [onUpdateZone])

  // 이름 변경
  const handleNameChange = useCallback((id: number, name: string) => {
    onUpdateZone(id, { name })
    setEditingZoneId(null)
  }, [onUpdateZone])

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="panel-base"
        data-tutorial="zone-panel"
        style={{
          position: 'absolute',
          bottom: 24,
          left: 16,
          padding: '10px 14px',
          color: 'var(--text-main)',
          cursor: 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 'var(--z-panel)',
          border: '1px solid var(--border-light)'
        }}
      >
        <Palette size={16} color="var(--accent-blue)" />
        {t.zoneManagement}
        <span style={{
          backgroundColor: 'var(--accent-blue)',
          color: '#000',
          padding: '2px 6px',
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 600
        }}>
          {zoneCount}
        </span>
      </button>
    )
  }

  return (
    <div
      className="panel-base animate-slide-up"
      style={{
        position: 'absolute',
        bottom: 24,
        left: 16,
        width: 320,
        padding: 20,
        zIndex: 'var(--z-panel)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
          <Palette size={18} color="var(--accent-blue)" />
          {t.zoneManagement}
        </div>
        <button
          onClick={onToggle}
          className="btn-icon"
          style={{ background: 'none', border: 'none', padding: 4 }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Zone List */}
      <div style={{
        maxHeight: 250,
        overflowY: 'auto',
        marginBottom: 16,
        paddingRight: 4
      }}>
        {zoneEntries.map(([zoneId, zone]) => (
          <div
            key={zoneId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px',
              backgroundColor: 'var(--bg-panel-hover)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--border-radius-sm)',
              marginBottom: 6,
              transition: 'background-color 0.2s'
            }}
          >
            {/* Color Picker */}
            <input
              type="color"
              value={zone.color}
              onChange={(e) => handleColorChange(Number(zoneId), e.target.value)}
              style={{
                width: 24,
                height: 24,
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                backgroundColor: 'transparent'
              }}
              title={t.zoneColor}
            />

            {/* Zone Name */}
            {editingZoneId === Number(zoneId) ? (
              <input
                type="text"
                defaultValue={zone.name}
                onBlur={(e) => handleNameChange(Number(zoneId), e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameChange(Number(zoneId), (e.target as HTMLInputElement).value)
                  }
                  if (e.key === 'Escape') {
                    setEditingZoneId(null)
                  }
                }}
                autoFocus
                className="input-base"
                style={{ flex: 1, padding: '4px 8px' }}
              />
            ) : (
              <span
                onClick={() => setEditingZoneId(Number(zoneId))}
                style={{
                  flex: 1,
                  color: 'var(--text-main)',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
                title={t.zoneName}
              >
                {zone.name}
              </span>
            )}

            {/* Delete Button */}
            <button
              onClick={() => handleDeleteZone(Number(zoneId))}
              disabled={zoneCount <= 1}
              className="btn-icon"
              data-tutorial="zone-delete"
              style={{
                color: zoneCount <= 1 ? 'var(--text-disabled)' : 'var(--accent-red)',
                padding: 4
              }}
              title={t.deleteZone}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Zone Section */}
      <div style={{
        display: 'flex',
        gap: 8,
        paddingTop: 16,
        borderTop: '1px solid var(--border-light)'
      }}>
        <input
          type="text"
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          placeholder={t.newZone}
          className="input-base"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddZone()
          }}
          style={{ flex: 1 }}
        />
        <button
          onClick={handleAddZone}
          className="btn-base btn-primary"
          data-tutorial="zone-add"
          style={{ padding: '8px 16px' }}
        >
          <Plus size={16} />
          {t.addZone}
        </button>
      </div>
    </div>
  )
}
