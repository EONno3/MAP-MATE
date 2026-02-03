import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Room, Zone, RoomDetail, TileType, ObjectType, RoomObject, TILES_PER_CHUNK_X, TILES_PER_CHUNK_Y, OBJECT_ICONS } from '../../types/map'
import { Translations } from '../../i18n/translations'
import { RoomToolbar } from './RoomToolbar'
import { RoomCanvas, RoomToolMode } from './RoomCanvas'
import { TilePalette } from './TilePalette'
import { ObjectPalette } from './ObjectPalette'
import { useHistory } from '../../hooks/useHistory'
import { RadialMenu, RadialMenuItem } from '../RadialMenu'
import type { TileCatalogApi } from '../../hooks/useTileCatalog'
import { selectTileKeyByDigitHotkey } from '../../lib/tileHotkeys'

// API URL
const API_URL = import.meta.env.VITE_API_URL || ''

interface RoomEditorProps {
  room: Room
  zone: Zone | null
  onBack: () => void
  onSave: (room: Room) => void
  t: Translations
  tileCatalog: TileCatalogApi
}

// 기본 방 레이아웃 생성
function generateDefaultRoomDetail(room: Room): RoomDetail {
  const tileWidth = room.w * TILES_PER_CHUNK_X
  const tileHeight = room.h * TILES_PER_CHUNK_Y

  // 벽으로 둘러싸인 빈 방 생성
  const tiles: TileType[][] = Array(tileHeight).fill(null).map((_, y) =>
    Array(tileWidth).fill(null).map((_, x) => {
      // 천장과 바닥
      if (y === 0 || y === tileHeight - 1) return 'solid'
      // 좌우 벽
      if (x === 0 || x === tileWidth - 1) return 'solid'
      // 바닥 근처 플랫폼 (랜덤하게 추가)
      if (y === tileHeight - 2 && x > 2 && x < tileWidth - 3) return 'solid'
      return 'empty'
    })
  )

  // 특수 방 타입에 따른 기본 오브젝트 배치
  const objects: RoomObject[] = []
  
  if (room.type === 'start') {
    objects.push({
      id: 'default_spawn',
      type: 'spawn_point',
      x: Math.floor(tileWidth / 2),
      y: tileHeight - 3
    })
  } else if (room.type === 'save') {
    objects.push({
      id: 'default_save',
      type: 'save_point',
      x: Math.floor(tileWidth / 2),
      y: tileHeight - 3
    })
  } else if (room.type === 'boss') {
    objects.push({
      id: 'default_enemy',
      type: 'enemy_spawn',
      x: Math.floor(tileWidth / 2),
      y: tileHeight - 3
    })
  } else if (room.type === 'item') {
    objects.push({
      id: 'default_chest',
      type: 'chest',
      x: Math.floor(tileWidth / 2),
      y: tileHeight - 3
    })
  } else if (room.type === 'shop') {
    objects.push({
      id: 'default_npc',
      type: 'npc',
      x: Math.floor(tileWidth / 2),
      y: tileHeight - 3
    })
  }

  return {
    roomId: room.id,
    tileWidth,
    tileHeight,
    tiles,
    objects
  }
}

// 오브젝트 휠 메뉴 아이템
const OBJECT_WHEEL_ITEMS: RadialMenuItem[] = [
  { id: 'spawn_point', label: '스폰 지점', icon: OBJECT_ICONS.spawn_point, color: '#22c55e' },
  { id: 'enemy_spawn', label: '적 스폰', icon: OBJECT_ICONS.enemy_spawn, color: '#ef4444' },
  { id: 'item', label: '아이템', icon: OBJECT_ICONS.item, color: '#eab308' },
  { id: 'chest', label: '보물상자', icon: OBJECT_ICONS.chest, color: '#a855f7' },
  { id: 'switch', label: '스위치', icon: OBJECT_ICONS.switch, color: '#06b6d4' },
  { id: 'npc', label: 'NPC', icon: OBJECT_ICONS.npc, color: '#f97316' },
  { id: 'save_point', label: '세이브', icon: OBJECT_ICONS.save_point, color: '#3b82f6' },
  { id: 'transition', label: '방 전환', icon: OBJECT_ICONS.transition, color: '#ec4899' }
]

export function RoomEditor({ room, zone, onBack, onSave, t, tileCatalog }: RoomEditorProps) {
  // Initialize room detail with history
  const {
    state: roomDetail,
    set: setRoomDetailHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory
  } = useHistory<RoomDetail>(room.detail || generateDefaultRoomDetail(room))
  
  const [selectedTile, setSelectedTile] = useState<TileType>('solid')
  const [selectedObject, setSelectedObject] = useState<ObjectType | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [brushSize, setBrushSize] = useState(1)
  const [toolMode, setToolMode] = useState<RoomToolMode>('brush')

  const {
    items: tileItems,
    paletteTiles,
    getColor: getTileColor,
    getLabel: getTileLabel,
    setTileColor,
    setTileName,
    addTile,
    deleteTile,
    resetTileCatalog,
  } = tileCatalog

  const [newTileName, setNewTileName] = useState('')
  const [newTileColor, setNewTileColor] = useState('#888888')

  // If a selected tile gets deleted, fall back to a builtin tile
  useEffect(() => {
    const exists = tileItems.some((t) => t.key === selectedTile)
    if (!exists) setSelectedTile('solid')
  }, [tileItems, selectedTile])
  
  // Radial Menu 상태
  const [showTileWheel, setShowTileWheel] = useState(false)
  const [showObjectWheel, setShowObjectWheel] = useState(false)
  const [wheelPosition, setWheelPosition] = useState({ x: 0, y: 0 })
  const keyHoldTimeout = useRef<number | null>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })

  // Update room detail when room changes
  useEffect(() => {
    // IMPORTANT: 방 전환 시 checkpoint 없이 baseline으로 reset해야
    // 첫 Undo가 "이전 방"으로 되돌아가며 UI가 망가지는 현상을 방지한다.
    resetHistory(room.detail || generateDefaultRoomDetail(room))
    setHasChanges(false)
  }, [room, resetHistory])

  // Handle tile update (recordHistory: true = 히스토리에 기록, false = 화면만 업데이트)
  const handleUpdateTiles = useCallback((tiles: TileType[][], recordHistory: boolean = true) => {
    setRoomDetailHistory({ ...roomDetail, tiles }, recordHistory)
    if (recordHistory) {
      setHasChanges(true)
    }
  }, [roomDetail, setRoomDetailHistory])

  // Handle objects update
  const handleUpdateObjects = useCallback((objects: RoomObject[], recordHistory: boolean = true) => {
    setRoomDetailHistory({ ...roomDetail, objects }, recordHistory)
    if (recordHistory) {
      setHasChanges(true)
    }
  }, [roomDetail, setRoomDetailHistory])

  // AI 프롬프트로 상세맵 생성
  const handleGenerateFromAI = useCallback(async () => {
    if (!aiPrompt.trim()) return
    
    setAiLoading(true)
    try {
      const response = await fetch(`${API_URL}/generate/room-detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          room_type: room.type,
          width: roomDetail.tileWidth,
          height: roomDetail.tileHeight,
          theme: zone?.name || 'default'
        })
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      
      // API 응답을 RoomDetail로 변환
      const newDetail: RoomDetail = {
        roomId: room.id,
        tileWidth: roomDetail.tileWidth,
        tileHeight: roomDetail.tileHeight,
        tiles: data.tiles || roomDetail.tiles,
        objects: data.objects || roomDetail.objects
      }

      setRoomDetailHistory(newDetail)
      setHasChanges(true)
    } catch (err) {
      console.error('Failed to generate room from AI:', err)
      alert('AI 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setAiLoading(false)
    }
  }, [aiPrompt, room.id, room.type, roomDetail.tileWidth, roomDetail.tileHeight, zone?.name, setRoomDetailHistory])

  // Handle save
  const handleSave = useCallback(() => {
    onSave({ ...room, detail: roomDetail })
    setHasChanges(false)
  }, [room, roomDetail, onSave])

  // Handle reset
  const handleReset = useCallback(() => {
    if (confirm(t.confirmReset)) {
      setRoomDetailHistory(generateDefaultRoomDetail(room))
      setHasChanges(true)
    }
  }, [room, t, setRoomDetailHistory])

  // Handle back with unsaved changes warning
  const handleBack = useCallback(() => {
    if (hasChanges) {
      if (confirm(t.unsavedChanges)) {
        onBack()
      }
    } else {
      onBack()
    }
  }, [hasChanges, onBack, t])

  // Tool selection - when object is selected, deselect tile mode
  const handleSelectObject = useCallback((obj: ObjectType | null) => {
    setSelectedObject(obj)
  }, [])

  const handleSelectTile = useCallback((tile: TileType) => {
    setSelectedTile(tile)
    setSelectedObject(null) // Deselect object when switching to tile mode
  }, [])

  // 마우스 위치 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // 키보드 단축키 (1/2 길게 누르면 휠 메뉴)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // 텍스트 입력 중에는 브라우저 기본 undo(입력 되돌리기)를 우선
      const isTextEditing =
        target.isContentEditable ||
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' &&
          ['text', 'search', 'email', 'password', 'url', 'tel'].includes(
            ((target as HTMLInputElement).type || '').toLowerCase()
          ))

      // Alt+1~9: 팔레트 순서 타일 빠른 선택 (커스텀 타일도 포함)
      if (e.altKey && !e.repeat) {
        const picked = selectTileKeyByDigitHotkey(paletteTiles, e.key)
        if (picked) {
          e.preventDefault()
          setSelectedTile(picked as TileType)
          setSelectedObject(null)
          setShowTileWheel(false)
          setShowObjectWheel(false)
          return
        }
      }

      // Ctrl+Z/Y 처리
      if (e.ctrlKey || e.metaKey) {
        // NOTE: e.key는 키보드 레이아웃/IME 영향으로 달라질 수 있어 e.code를 사용
        if (e.code === 'KeyZ') {
          if (isTextEditing) return
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
          return
        }
        if (e.code === 'KeyY') {
          if (isTextEditing) return
          e.preventDefault()
          redo()
          return
        }
      }

      // 1 또는 2 키 길게 누르면 휠 표시
      if (!e.repeat) {
        if (e.key === '1') {
          keyHoldTimeout.current = window.setTimeout(() => {
            setWheelPosition(mousePositionRef.current)
            setShowTileWheel(true)
          }, 200) // 200ms 홀드 후 표시
        } else if (e.key === '2') {
          keyHoldTimeout.current = window.setTimeout(() => {
            setWheelPosition(mousePositionRef.current)
            setShowObjectWheel(true)
          }, 200)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // 타임아웃 취소
      if (keyHoldTimeout.current) {
        clearTimeout(keyHoldTimeout.current)
        keyHoldTimeout.current = null
      }

      // 짧게 누르면 도구 전환
      if (e.key === '1' && !showTileWheel) {
        setSelectedObject(null) // 타일 모드로 전환
      } else if (e.key === '2' && !showObjectWheel) {
        // 오브젝트 모드로 전환 (첫 번째 오브젝트 선택)
        if (!selectedObject) {
          setSelectedObject('spawn_point')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (keyHoldTimeout.current) {
        clearTimeout(keyHoldTimeout.current)
      }
    }
  }, [undo, redo, showTileWheel, showObjectWheel, selectedObject, paletteTiles])

  // 휠 메뉴에서 선택
  const handleTileWheelSelect = useCallback((id: string) => {
    setSelectedTile(id as TileType)
    setSelectedObject(null)
    setShowTileWheel(false)
  }, [])

  const handleObjectWheelSelect = useCallback((id: string) => {
    setSelectedObject(id as ObjectType)
    setShowObjectWheel(false)
  }, [])

  const tileWheelItems: RadialMenuItem[] = useMemo(() => {
    return paletteTiles.map((tile) => ({
      id: tile,
      label: getTileLabel(tile),
      icon: undefined,
      color: getTileColor(tile),
    }))
  }, [paletteTiles, getTileLabel, getTileColor])

  const tileColorMap = useMemo(() => {
    const out: Record<string, string> = {}
    for (const it of tileItems) out[it.key] = it.color
    return out
  }, [tileItems])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0d0d12'
    }}>
      {/* Toolbar */}
      <RoomToolbar
        room={room}
        zone={zone}
        onBack={handleBack}
        onSave={handleSave}
        onReset={handleReset}
        t={t}
      />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Canvas */}
        <RoomCanvas
          roomDetail={roomDetail}
          selectedTile={selectedTile}
          selectedObject={selectedObject}
          brushSize={brushSize}
          toolMode={toolMode}
          onUpdateTiles={handleUpdateTiles}
          onUpdateObjects={handleUpdateObjects}
          tileColors={tileColorMap as any}
          t={t}
        />

        {/* Right Panel */}
        <div style={{
          width: 320,
          flex: '0 0 320px',
          minWidth: 320,
          backgroundColor: '#1a1a24',
          borderLeft: '1px solid #333',
          padding: 16,
          overflowY: 'auto'
        }}>
          {/* Undo/Redo */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16
          }}>
            <button
              onClick={undo}
              disabled={!canUndo}
              title={`${t.undo} (Ctrl+Z)`}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: canUndo ? '#555' : '#333',
                color: canUndo ? '#fff' : '#666',
                border: 'none',
                borderRadius: 4,
                cursor: canUndo ? 'pointer' : 'not-allowed',
                fontSize: 13
              }}
            >
              ↩️ {t.undo}
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title={`${t.redo} (Ctrl+Y)`}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: canRedo ? '#555' : '#333',
                color: canRedo ? '#fff' : '#666',
                border: 'none',
                borderRadius: 4,
                cursor: canRedo ? 'pointer' : 'not-allowed',
                fontSize: 13
              }}
            >
              ↪️ {t.redo}
            </button>
          </div>

          {/* AI Generation Section */}
          <div style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#1a1520',
            borderRadius: 8,
            border: '1px solid #3d2963'
          }}>
            <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 8, fontWeight: 600 }}>
              🤖 AI 상세맵 생성
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="예: 플랫폼이 많은 수직 구조, 가시 함정 있음"
              style={{
                width: '100%',
                minHeight: 60,
                padding: '8px',
                backgroundColor: '#252530',
                border: '1px solid #444',
                borderRadius: 4,
                color: '#fff',
                fontSize: 11,
                resize: 'vertical',
                marginBottom: 8
              }}
            />
            <button
              onClick={handleGenerateFromAI}
              disabled={aiLoading || !aiPrompt.trim()}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: aiLoading ? '#333' : !aiPrompt.trim() ? '#444' : '#7c3aed',
                border: 'none',
                borderRadius: 4,
                color: '#fff',
                cursor: aiLoading || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {aiLoading ? '⏳ 생성 중...' : '🎨 AI 생성'}
            </button>
          </div>

          {/* Tool Info */}
          <div style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#252530',
            borderRadius: 8
          }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
              {t.currentTool}
            </div>
            <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
              {selectedObject ? (
                <>📦 {t.objectMode}</>
              ) : (
                <>🖌️ {t.tileMode}</>
              )}
            </div>
          </div>

          {/* Brush/Fill Tool Toggle - Only visible in tile mode */}
          {!selectedObject && (
            <div style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: '#252530',
              borderRadius: 8
            }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                🔧 {t.toolType || '도구 종류'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setToolMode('brush')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: toolMode === 'brush' ? '#4a90d9' : '#333',
                    border: toolMode === 'brush' ? '2px solid #6ab0ff' : '2px solid transparent',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  🖌️ {t.brushTool || '브러시'}
                </button>
                <button
                  onClick={() => setToolMode('fill')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: toolMode === 'fill' ? '#22c55e' : '#333',
                    border: toolMode === 'fill' ? '2px solid #4ade80' : '2px solid transparent',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                >
                  ⬜ {t.fillTool || '채우기'}
                </button>
              </div>
            </div>
          )}

          {/* Brush Size - Only visible in brush mode */}
          {!selectedObject && toolMode === 'brush' && (
            <div style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: '#252530',
              borderRadius: 8
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8
              }}>
                <span style={{ fontSize: 11, color: '#888' }}>
                  📏 {t.brushSize || '브러시 크기'}
                </span>
                <span style={{ 
                  fontSize: 13, 
                  color: '#fff',
                  fontWeight: 600,
                  backgroundColor: '#4a90d9',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  {brushSize}×{brushSize}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: 24,
                  cursor: 'pointer',
                  accentColor: '#4a90d9'
                }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: 10,
                color: '#666',
                marginTop: 4
              }}>
                <span>1×1</span>
                <span>3×3</span>
                <span>5×5</span>
              </div>
            </div>
          )}

          {/* Tile Palette */}
          <TilePalette
            selectedTile={selectedTile}
            onSelectTile={handleSelectTile}
            tileColors={tileColorMap as any}
            t={t}
            tiles={tileItems.map((it) => ({ key: it.key, color: it.color, label: it.label }))}
          />

          {/* Tile 관리 (색상/이름/추가) */}
          <div style={{
            marginTop: 12,
            marginBottom: 16,
            padding: 12,
            backgroundColor: '#252530',
            borderRadius: 8
          }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 10, fontWeight: 600 }}>
              🎨 타일 관리(색상/이름/추가)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tileItems.map((tile) => (
                <div
                  key={tile.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    paddingBottom: 8,
                    borderBottom: '1px solid #333'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{
                      width: 18,
                      height: 18,
                      backgroundColor: tile.color,
                      borderRadius: 4,
                      border: tile.key === 'empty' ? '1px dashed #666' : '1px solid #444',
                      flex: '0 0 auto'
                    }} />
                    <span style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 11,
                      color: '#ccc',
                      whiteSpace: 'nowrap',
                      wordBreak: 'keep-all',
                      overflowWrap: 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {tile.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="color"
                      value={tile.color as string}
                      onChange={(e) => setTileColor(tile.key, e.target.value)}
                      style={{ width: 34, height: 28, border: 'none', background: 'transparent', cursor: 'pointer' }}
                      title={`${tile.key} 색상`}
                    />
                    <button
                      onClick={() => {
                        const next = prompt('타일명(한국어)', tile.label) ?? ''
                        setTileName(tile.key, next)
                      }}
                      style={{ padding: '6px 8px', fontSize: 11, background: '#333', border: '1px solid #444', color: '#ddd', borderRadius: 6, cursor: 'pointer' }}
                      title="타일명 변경"
                    >
                      이름
                    </button>
                    <button
                      onClick={() => {
                        if (tile.isBuiltin) return
                        const ok = confirm(`타일을 삭제할까요?\n\n- ${tile.label}\n- key: ${tile.key}\n\n(현재 방에서 사용 중이면 '빈 공간'으로 표시될 수 있습니다.)`)
                        if (!ok) return
                        deleteTile(tile.key)
                      }}
                      disabled={tile.isBuiltin}
                      style={{
                        padding: '6px 8px',
                        fontSize: 11,
                        background: tile.isBuiltin ? '#2a2a34' : '#3a1f1f',
                        border: '1px solid #444',
                        color: tile.isBuiltin ? '#666' : '#ffb4b4',
                        borderRadius: 6,
                        cursor: tile.isBuiltin ? 'not-allowed' : 'pointer'
                      }}
                      title={tile.isBuiltin ? '기본 타일은 삭제할 수 없습니다' : '타일 삭제'}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #333' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600 }}>➕ 새 타일 추가</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={newTileName}
                  onChange={(e) => setNewTileName(e.target.value)}
                  placeholder="타일명(한국어)"
                  style={{ flex: 1, padding: '6px 8px', background: '#1a1a24', border: '1px solid #444', borderRadius: 6, color: '#fff', fontSize: 11 }}
                />
                <input
                  type="color"
                  value={newTileColor}
                  onChange={(e) => setNewTileColor(e.target.value)}
                  style={{ width: 34, height: 34, border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
              </div>
              <button
                onClick={() => {
                  addTile({ color: newTileColor, name: newTileName || undefined })
                  setNewTileName('')
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                새 타일 추가
              </button>
            </div>
            <button
              onClick={resetTileCatalog}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '8px',
                backgroundColor: '#333',
                border: '1px solid #444',
                borderRadius: 6,
                color: '#ddd',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              타일 설정 초기화
            </button>
            <div style={{ marginTop: 8, fontSize: 10, color: '#666', lineHeight: 1.4 }}>
              설정은 브라우저(localStorage)에 저장됩니다.
            </div>
          </div>

          {/* Object Palette */}
          <ObjectPalette
            selectedObject={selectedObject}
            onSelectObject={handleSelectObject}
            t={t}
          />

          {/* Unsaved indicator */}
          {hasChanges && (
            <div style={{
              marginTop: 16,
              padding: 10,
              backgroundColor: '#4a3520',
              borderRadius: 6,
              fontSize: 11,
              color: '#ffaa00',
              textAlign: 'center'
            }}>
              ⚠️ {t.unsavedChangesIndicator}
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <div style={{
            marginTop: 16,
            padding: 10,
            backgroundColor: '#252530',
            borderRadius: 6,
            fontSize: 10,
            color: '#666'
          }}>
            <div style={{ marginBottom: 4, color: '#888' }}>💡 단축키:</div>
            <div>• 1: 타일 모드 (길게: 휠 메뉴)</div>
            <div>• 2: 오브젝트 모드 (길게: 휠 메뉴)</div>
            <div>• Ctrl+Z/Y: 실행취소/다시실행</div>
          </div>
        </div>
      </div>

      {/* Radial Menus */}
      <RadialMenu
        items={tileWheelItems}
        position={wheelPosition}
        visible={showTileWheel}
        onSelect={handleTileWheelSelect}
        onClose={() => setShowTileWheel(false)}
        title="타일"
      />
      <RadialMenu
        items={OBJECT_WHEEL_ITEMS}
        position={wheelPosition}
        visible={showObjectWheel}
        onSelect={handleObjectWheelSelect}
        onClose={() => setShowObjectWheel(false)}
        title="오브젝트"
      />
    </div>
  )
}

export { generateDefaultRoomDetail }


