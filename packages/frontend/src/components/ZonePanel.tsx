import React, { useState, useCallback } from 'react'
import { Zone } from '../types/map'
import { Translations } from '../i18n/translations'

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
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          padding: '10px 14px',
          backgroundColor: '#252530',
          border: '1px solid #444',
          borderRadius: 8,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 100
        }}
      >
        <span>🎨</span>
        {t.zoneManagement}
        <span style={{ 
          backgroundColor: '#4a90d9',
          padding: '2px 6px',
          borderRadius: 10,
          fontSize: 11
        }}>
          {zoneCount}
        </span>
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      width: 300,
      backgroundColor: '#1a1a24',
      border: '1px solid #333',
      borderRadius: 12,
      padding: 16,
      zIndex: 100,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🎨</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
            {t.zoneManagement}
          </span>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: 18,
            cursor: 'pointer',
            padding: 4
          }}
        >
          ✕
        </button>
      </div>

      {/* Zone List */}
      <div style={{ 
        maxHeight: 250,
        overflowY: 'auto',
        marginBottom: 12
      }}>
        {zoneEntries.map(([zoneId, zone]) => (
          <div
            key={zoneId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px',
              backgroundColor: '#252530',
              borderRadius: 6,
              marginBottom: 6
            }}
          >
            {/* Color Picker */}
            <input
              type="color"
              value={zone.color}
              onChange={(e) => handleColorChange(Number(zoneId), e.target.value)}
              style={{
                width: 32,
                height: 32,
                border: 'none',
                borderRadius: 4,
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
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  backgroundColor: '#1a1a24',
                  border: '1px solid #4a90d9',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 13
                }}
              />
            ) : (
              <span
                onClick={() => setEditingZoneId(Number(zoneId))}
                style={{
                  flex: 1,
                  color: '#fff',
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
              style={{
                background: 'none',
                border: 'none',
                color: zoneCount <= 1 ? '#444' : '#ff6b6b',
                fontSize: 14,
                cursor: zoneCount <= 1 ? 'not-allowed' : 'pointer',
                padding: 4
              }}
              title={t.deleteZone}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Add Zone Section */}
      <div style={{
        display: 'flex',
        gap: 8,
        paddingTop: 12,
        borderTop: '1px solid #333'
      }}>
        <input
          type="text"
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          placeholder={t.newZone}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddZone()
          }}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#252530',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13
          }}
        />
        <button
          onClick={handleAddZone}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4a90d9',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <span>➕</span>
          {t.addZone}
        </button>
      </div>
    </div>
  )
}


