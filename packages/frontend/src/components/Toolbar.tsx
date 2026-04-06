import React from 'react'
import { Translations } from '../i18n/translations'
import { EditorTool } from '../types/map'
import {
  Map,
  Loader2,
  Dices,
  Save,
  Puzzle,
  FolderOpen,
  Undo2,
  Redo2,
  MousePointer2,
  PenTool,
  Link,
  HelpCircle,
  Image as ImageIcon,
  Sparkles,
  HardDriveDownload,
  HardDriveUpload
} from 'lucide-react'

interface ToolbarProps {
  onGenerate: () => void
  onExport: () => void
  onExportUnity: () => void
  onExportImage?: () => void
  onImport: () => void
  onSaveLocal?: () => void
  onLoadLocal?: () => void
  loading: boolean
  canGenerate?: boolean
  interactive?: boolean
  roomCount: number
  t: Translations
  buildId?: string
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
  onExportUnity,
  onExportImage,
  onImport,
  onSaveLocal,
  onLoadLocal,
  loading,
  canGenerate = true,
  interactive = true,
  roomCount,
  t,
  buildId,
  currentTool = 'select',
  onToolChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo
}: ToolbarProps) {

  const disableGenerate = loading || !canGenerate
  const disableEditActions = !interactive
  const disableExport = roomCount === 0 || disableEditActions
  const disableImport = loading

  return (
    <div
      className="panel-base"
      style={{
        height: 56,
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 16,
        zIndex: 'var(--z-panel)'
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginRight: 16
      }}>
        <Map size={28} color="var(--accent-blue)" />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            {t.appName}
          </span>
          {buildId && (
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
              {buildId}
            </span>
          )}
        </div>
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-light)' }} />

      {/* Action Buttons */}
      <button
        onClick={onGenerate}
        disabled={disableGenerate}
        className="btn-base btn-primary"
        data-tutorial="toolbar-generate"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {t.generating}
          </>
        ) : (
          <>
            <Dices size={16} />
            {t.generate}
          </>
        )}
      </button>

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-light)', margin: '0 4px' }} />

      {/* Local Save / Load */}
      {onSaveLocal && (
        <button
          onClick={onSaveLocal}
          disabled={disableExport}
          className="btn-base btn-secondary"
          title={t.localSave}
        >
          <HardDriveDownload size={16} color="var(--accent-blue)" />
          {t.localSave}
        </button>
      )}

      {onLoadLocal && (
        <button
          onClick={onLoadLocal}
          disabled={loading}
          className="btn-base btn-secondary"
          title={t.localLoad}
        >
          <HardDriveUpload size={16} color="var(--accent-blue)" />
          {t.localLoad}
        </button>
      )}

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-light)', margin: '0 4px' }} />

      <button
        onClick={onImport}
        disabled={disableImport}
        className="btn-base btn-secondary"
        data-tutorial="toolbar-import"
      >
        <FolderOpen size={16} />
        {t.importJson}
      </button>

      <button
        onClick={onExport}
        disabled={disableExport}
        className="btn-base btn-secondary"
        data-tutorial="toolbar-export"
      >
        <Save size={16} />
        {t.exportJson}
      </button>

      <button
        onClick={onExportUnity}
        disabled={disableExport}
        className="btn-base btn-secondary"
        data-tutorial="toolbar-export-unity"
      >
        <Puzzle size={16} />
        {t.exportUnity}
      </button>

      {onExportImage && (
        <button
          onClick={onExportImage}
          disabled={disableExport}
          className="btn-base btn-secondary"
          title="이미지로 내보내기"
        >
          <ImageIcon size={16} />
          이미지
        </button>
      )}

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-light)' }} />

      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={onUndo}
          disabled={!canUndo || disableEditActions}
          className="btn-base btn-icon"
          title={`${t.undo} (Ctrl+Z)`}
          data-tutorial="toolbar-undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo || disableEditActions}
          className="btn-base btn-icon"
          title={`${t.redo} (Ctrl+Y)`}
          data-tutorial="toolbar-redo"
        >
          <Redo2 size={18} />
        </button>
      </div>

      <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-light)' }} />

      {/* Editor Tools */}
      {onToolChange && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onToolChange('select')}
            disabled={disableEditActions}
            title={t.toolSelect}
            className={`btn-base btn-icon ${currentTool === 'select' ? 'active' : ''}`}
            style={{ padding: '6px 12px', gap: 6 }}
            data-tutorial="toolbar-tool-select"
          >
            <MousePointer2 size={16} />
            {t.toolSelect}
          </button>
          <button
            onClick={() => onToolChange('draw')}
            disabled={disableEditActions}
            title={t.toolDraw}
            className={`btn-base btn-icon ${currentTool === 'draw' ? 'active' : ''}`}
            style={{ padding: '6px 12px', gap: 6 }}
            data-tutorial="toolbar-tool-draw"
          >
            <PenTool size={16} />
            {t.toolDraw}
          </button>
          <button
            onClick={() => onToolChange('connect')}
            disabled={disableEditActions}
            title={t.toolConnect}
            className={`btn-base btn-icon ${currentTool === 'connect' ? 'active' : ''}`}
            style={{ padding: '6px 12px', gap: 6 }}
            data-tutorial="toolbar-tool-connect"
          >
            <Link size={16} />
            {t.toolConnect}
          </button>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Help & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Tutorial Mode Toggle Button */}
          <button
            className="btn-base btn-icon"
            title="튜토리얼 모드 (기능 설명 보기)"
            onClick={() => window.dispatchEvent(new Event('toggle-tutorial-mode'))}
            data-tutorial="toolbar-tutorial-mode"
            data-tutorial-bypass="true"
            style={{ color: 'var(--accent-yellow)', border: '1px solid rgba(250, 204, 21, 0.3)', backgroundColor: 'rgba(250, 204, 21, 0.05)' }}
          >
            <Sparkles size={18} />
          </button>

          <button
            className="btn-base btn-icon"
            title="단축키 및 도움말"
            onClick={() => window.dispatchEvent(new Event('toggle-help-modal'))}
            data-tutorial="toolbar-help"
          >
            <HelpCircle size={18} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{t.rooms}: <strong style={{ color: 'var(--text-main)' }}>{roomCount}</strong></span>
        </div>
      </div>
    </div>
  )
}
