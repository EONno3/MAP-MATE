import React, { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export function UnsavedChangesDialog({
  isOpen,
  title,
  description,
  stayLabel,
  leaveWithoutSavingLabel,
  saveAndLeaveLabel,
  onStay,
  onLeaveWithoutSaving,
  onSaveAndLeave,
}: {
  isOpen: boolean
  title: string
  description: string
  stayLabel: string
  leaveWithoutSavingLabel: string
  saveAndLeaveLabel: string
  onStay: () => void
  onLeaveWithoutSaving: () => void
  onSaveAndLeave: () => void
}) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStay()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onStay])

  if (!isOpen) return null

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(13, 13, 18, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: 20,
      }}
      onClick={onStay}
    >
      <div
        className="panel-base animate-slide-up"
        style={{
          width: 520,
          maxWidth: '92vw',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <AlertTriangle size={20} color="var(--accent-red)" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
                {description}
              </div>
            </div>
          </div>
          <button
            onClick={onStay}
            className="btn-base btn-icon"
            style={{ color: 'var(--text-muted)' }}
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ padding: 16, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onLeaveWithoutSaving}
            className="btn-base btn-secondary"
            style={{ padding: '10px 14px' }}
          >
            {leaveWithoutSavingLabel}
          </button>
          <button
            onClick={onSaveAndLeave}
            className="btn-base btn-primary"
            style={{ padding: '10px 14px' }}
          >
            {saveAndLeaveLabel}
          </button>
          <button
            onClick={onStay}
            className="btn-base"
            style={{ padding: '10px 14px' }}
          >
            {stayLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

