import React, { useState, useEffect } from 'react'
import { Translations } from '../i18n/translations'
import { LocalSaveSlot, getLocalSaves, deleteLocalSave } from '../lib/localSaveManager'
import { X, Trash2, Clock, Map as MapIcon, HardDriveDownload, HardDriveUpload } from 'lucide-react'

interface LocalSaveModalProps {
  isOpen: boolean
  mode: 'save' | 'load'
  onClose: () => void
  onSave: (name: string, saveId?: string) => void
  onLoad: (saveId: string) => void
  t: Translations
  currentSaveId: string | null
}

export function LocalSaveModal({
  isOpen,
  mode,
  onClose,
  onSave,
  onLoad,
  t,
  currentSaveId
}: LocalSaveModalProps) {
  const [saves, setSaves] = useState<LocalSaveSlot[]>([])
  const [mapName, setMapName] = useState('')

  useEffect(() => {
    if (isOpen) {
      const loadedSaves = getLocalSaves()
      // Sort by updatedAt descending
      loadedSaves.sort((a, b) => b.updatedAt - a.updatedAt)
      setSaves(loadedSaves)
      
      if (mode === 'save') {
        if (currentSaveId) {
          const current = loadedSaves.find(s => s.id === currentSaveId)
          if (current) {
            setMapName(current.name)
          } else {
            setMapName('')
          }
        } else {
          setMapName('')
        }
      }
    }
  }, [isOpen, mode, currentSaveId])

  if (!isOpen) return null

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm(t.confirmDeleteMap)) {
      deleteLocalSave(id)
      setSaves(getLocalSaves().sort((a, b) => b.updatedAt - a.updatedAt))
    }
  }

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mapName.trim()) return
    onSave(mapName.trim(), currentSaveId || undefined)
  }

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp))
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(13, 13, 18, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div className="panel-base animate-slide-up" style={{
        width: 480,
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {mode === 'save' ? <HardDriveDownload size={24} color="var(--accent-blue)" /> : <HardDriveUpload size={24} color="var(--accent-blue)" />}
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              {mode === 'save' ? t.saveMapTitle : t.loadMapTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-base btn-icon"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {mode === 'save' && (
            <form onSubmit={handleSaveSubmit} style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                {t.mapName}
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  value={mapName}
                  onChange={e => setMapName(e.target.value)}
                  placeholder={t.mapNamePlaceholder}
                  autoFocus
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: 'var(--text-main)',
                    fontSize: 14,
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!mapName.trim()}
                  className="btn-base btn-primary"
                  style={{ padding: '0 20px' }}
                >
                  {t.saveAction}
                </button>
              </div>
            </form>
          )}

          <div>
            <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 12 }}>
              {mode === 'save' ? '기존에 저장된 맵' : '저장된 맵 목록'}
            </h3>
            
            {saves.length === 0 ? (
              <div style={{ 
                padding: 32, 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px dashed var(--border-light)'
              }}>
                <MapIcon size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                {t.noSavedMaps}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {saves.map(save => (
                  <div
                    key={save.id}
                    onClick={() => {
                      if (mode === 'load') {
                        onLoad(save.id)
                      } else {
                        // In save mode, clicking an existing save populates the name
                        setMapName(save.name)
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: currentSaveId === save.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-main)', marginBottom: 4 }}>
                        {save.name}
                        {currentSaveId === save.id && (
                          <span style={{ 
                            fontSize: 11, 
                            color: 'var(--accent-blue)', 
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            marginLeft: 8
                          }}>현재 맵</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {formatDate(save.updatedAt)}
                        </span>
                        <span>방 {save.mapData.rooms.length}개</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={e => handleDelete(e, save.id)}
                      className="btn-base btn-icon"
                      style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                      onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--accent-red)' }}
                      onMouseOut={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
