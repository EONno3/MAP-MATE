import React, { useState, useEffect } from 'react'
import { Translations } from '../../i18n/translations'
import { Room, Zone } from '../../types/map'
import { ArrowLeft, RotateCcw, Save, AlertTriangle, Undo2, Redo2, RefreshCw } from 'lucide-react'

interface RoomToolbarProps {
  room: Room
  zone: Zone | null
  onBack: () => void
  onSave: (room: Room) => void
  onReset: () => void
  hasUnsavedChanges: boolean
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  t: Translations
}

export function RoomToolbar({
  room,
  zone,
  onBack,
  onSave,
  onReset,
  hasUnsavedChanges,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  t
}: RoomToolbarProps) {
  const [title, setTitle] = useState(room.name || '')

  // Handle title change locally, save to room object when Save is clicked
  useEffect(() => {
    setTitle(room.name || '')
  }, [room.name])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    // We could emit a title change event here if we wanted immediate update
  }

  const handleSave = () => {
    onSave({
      ...room,
      name: title
    })
  }

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
      {/* Back */}
      <button
        onClick={onBack}
        className="btn-base"
        style={{ padding: '6px 12px', gap: 6, fontWeight: 500 }}
        data-tutorial="roomeditor-back"
        data-tutorial-bypass="true" // Allow users to exit room editor to continue testing
      >
        <ArrowLeft size={16} />
        {t.backToWorldMap}
      </button>

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-light)' }} />

      {/* Room Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          backgroundColor: zone?.color || '#555',
          boxShadow: 'var(--shadow-sm)'
        }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          ({room.w * 10} × {room.h * 6} {t.tiles})
        </span>
      </div>

      {/* Name Input */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="방 이름"
        className="input-base"
        style={{ width: 160, padding: '4px 8px' }}
      />

      {/* Unsaved indicator */}
      {hasUnsavedChanges && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-orange)' }}>
          <AlertTriangle size={14} />
          <span style={{ fontSize: 13 }}>{t.unsavedChangesIndicator || '저장되지 않은 변경사항'}</span>
        </div>
      )}

      {/* History Controls */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="btn-base btn-icon"
          title={`${t.undo} (Ctrl+Z)`}
          data-tutorial="toolbar-undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="btn-base btn-icon"
          title={`${t.redo} (Ctrl+Y)`}
          data-tutorial="toolbar-redo"
        >
          <Redo2 size={16} />
        </button>
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-light)', margin: '0 8px' }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onReset}
          disabled={!hasUnsavedChanges}
          className="btn-base btn-secondary"
          title={t.reset}
          data-tutorial="roomeditor-reset"
        >
          <RefreshCw size={16} />
          {t.reset}
        </button>
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className="btn-base btn-primary"
          title={t.save}
          data-tutorial="roomeditor-save"
        >
          <Save size={16} />
          {t.save}
        </button>
      </div>
    </div>
  )
}
