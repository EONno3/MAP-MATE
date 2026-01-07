import React from 'react'
import { Translations, Language } from '../i18n/translations'
import { EditorTool } from '../types/map'

interface ToolbarProps {
  onGenerate: () => void
  onExport: () => void
  onImport: () => void
  loading: boolean
  roomCount: number
  t: Translations
  language: Language
  onLanguageChange: (lang: Language) => void
  // Editor tools
  currentTool?: EditorTool
  onToolChange?: (tool: EditorTool) => void
  // Undo/Redo
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
}

export function Toolbar({ 
  onGenerate, 
  onExport, 
  onImport, 
  loading, 
  roomCount,
  t,
  language,
  onLanguageChange,
  currentTool = 'select',
  onToolChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}: ToolbarProps) {
  const toolButtonStyle = (tool: EditorTool) => ({
    padding: '6px 10px',
    backgroundColor: currentTool === tool ? '#4CAF50' : 'transparent',
    border: currentTool === tool ? 'none' : '1px solid #444',
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'all 0.2s'
  })
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
      {/* Logo */}
      <div style={{
        fontSize: 18,
        fontWeight: 700,
        color: '#fff',
        marginRight: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{ fontSize: 24 }}>🗺️</span>
        <span>{t.appName}</span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 30, backgroundColor: '#333' }} />

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: loading ? '#333' : '#4CAF50',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'wait' : 'pointer',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'background-color 0.2s'
        }}
      >
        {loading ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            {t.generating}
          </>
        ) : (
          <>
            <span>🎲</span>
            {t.generate}
          </>
        )}
      </button>

      {/* Export Button */}
      <button
        onClick={onExport}
        disabled={roomCount === 0}
        style={{
          padding: '8px 16px',
          backgroundColor: roomCount === 0 ? '#333' : '#2196F3',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: roomCount === 0 ? 'not-allowed' : 'pointer',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
      >
        <span>💾</span>
        {t.exportJson}
      </button>

      {/* Import Button */}
      <label style={{
        padding: '8px 16px',
        backgroundColor: '#7b1fa2',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <span>📂</span>
        {t.importJson}
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              onImport()
            }
            e.target.value = ''
          }}
          style={{ display: 'none' }}
        />
      </label>

      {/* Divider */}
      <div style={{ width: 1, height: 30, backgroundColor: '#333' }} />

      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title={`${t.undo} (Ctrl+Z)`}
          style={{
            padding: '6px 10px',
            backgroundColor: canUndo ? '#555' : '#333',
            color: canUndo ? '#fff' : '#666',
            border: 'none',
            borderRadius: 4,
            cursor: canUndo ? 'pointer' : 'not-allowed',
            fontSize: 14
          }}
        >
          ↩️
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title={`${t.redo} (Ctrl+Y)`}
          style={{
            padding: '6px 10px',
            backgroundColor: canRedo ? '#555' : '#333',
            color: canRedo ? '#fff' : '#666',
            border: 'none',
            borderRadius: 4,
            cursor: canRedo ? 'pointer' : 'not-allowed',
            fontSize: 14
          }}
        >
          ↪️
        </button>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 30, backgroundColor: '#333' }} />

      {/* Editor Tools */}
      {onToolChange && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onToolChange('select')}
            title={t.toolSelect}
            style={toolButtonStyle('select')}
          >
            <span>👆</span>
            {t.toolSelect}
          </button>
          <button
            onClick={() => onToolChange('draw')}
            title={t.toolDraw}
            style={toolButtonStyle('draw')}
          >
            <span>✏️</span>
            {t.toolDraw}
          </button>
          <button
            onClick={() => onToolChange('connect')}
            title={t.toolConnect}
            style={toolButtonStyle('connect')}
          >
            <span>🔗</span>
            {t.toolConnect}
          </button>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Language Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginRight: 16
      }}>
        <button
          onClick={() => onLanguageChange('ko')}
          style={{
            padding: '4px 8px',
            backgroundColor: language === 'ko' ? '#4CAF50' : 'transparent',
            border: language === 'ko' ? 'none' : '1px solid #444',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          🇰🇷 한국어
        </button>
        <button
          onClick={() => onLanguageChange('en')}
          style={{
            padding: '4px 8px',
            backgroundColor: language === 'en' ? '#4CAF50' : 'transparent',
            border: language === 'en' ? 'none' : '1px solid #444',
            borderRadius: 4,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          🇺🇸 EN
        </button>
      </div>

      {/* Stats */}
      <div style={{
        fontSize: 12,
        color: '#888',
        display: 'flex',
        gap: 16
      }}>
        <span>{t.rooms}: <strong style={{ color: '#fff' }}>{roomCount}</strong></span>
      </div>
    </div>
  )
}
