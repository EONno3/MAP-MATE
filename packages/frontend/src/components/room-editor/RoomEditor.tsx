import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Room, Zone, RoomDetail, TileType, ObjectType, RoomObject, TILES_PER_CHUNK_X, TILES_PER_CHUNK_Y, TILE_ICONS, OBJECT_ICONS } from '../../types/map'
import { Translations } from '../../i18n/translations'
import { RoomToolbar } from './RoomToolbar'
import { RoomCanvas, RoomToolMode } from './RoomCanvas'
import { TilePalette } from './TilePalette'
import { ObjectPalette } from './ObjectPalette'
import { useHistory } from '../../hooks/useHistory'
import { RadialMenu, RadialMenuItem } from '../RadialMenu'

// API URL
const API_URL = import.meta.env.VITE_API_URL || ''

interface RoomEditorProps {
  room: Room
  zone: Zone | null
  onBack: () => void
  onSave: (room: Room) => void
  t: Translations
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

// 타일 휠 메뉴 아이템
const TILE_WHEEL_ITEMS: RadialMenuItem[] = [
  { id: 'solid', label: '벽/바닥', icon: TILE_ICONS.solid, color: '#444' },
  { id: 'empty', label: '빈 공간', icon: TILE_ICONS.empty, color: '#222' },
  { id: 'platform', label: '플랫폼', icon: TILE_ICONS.platform, color: '#8B4513' },
  { id: 'spike', label: '가시', icon: TILE_ICONS.spike, color: '#ff4444' },
  { id: 'acid', label: '산성', icon: TILE_ICONS.acid, color: '#00ff00' },
  { id: 'breakable', label: '부서지는 벽', icon: TILE_ICONS.breakable, color: '#8B7355' },
  { id: 'door', label: '문', icon: TILE_ICONS.door, color: '#4a90d9' }
]

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

export function RoomEditor({ room, zone, onBack, onSave, t }: RoomEditorProps) {
  // Initialize room detail with history
  const {
    state: roomDetail,
    set: setRoomDetailHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clear: clearHistory
  } = useHistory<RoomDetail>(room.detail || generateDefaultRoomDetail(room))
  
  const [selectedTile, setSelectedTile] = useState<TileType>('solid')
  const [selectedObject, setSelectedObject] = useState<ObjectType | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [brushSize, setBrushSize] = useState(1)
  const [toolMode, setToolMode] = useState<RoomToolMode>('brush')
  
  // Radial Menu 상태
  const [showTileWheel, setShowTileWheel] = useState(false)
  const [showObjectWheel, setShowObjectWheel] = useState(false)
  const [wheelPosition, setWheelPosition] = useState({ x: 0, y: 0 })
  const keyHoldTimeout = useRef<number | null>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })

  // Update room detail when room changes
  useEffect(() => {
    clearHistory()
    setRoomDetailHistory(room.detail || generateDefaultRoomDetail(room), false)
    setHasChanges(false)
  }, [room, clearHistory, setRoomDetailHistory])

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
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // Ctrl+Z/Y 처리
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
          return
        }
        if (e.key === 'y') {
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
  }, [undo, redo, showTileWheel, showObjectWheel, selectedObject])

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
          t={t}
        />

        {/* Right Panel */}
        <div style={{
          width: 220,
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
            t={t}
          />

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
        items={TILE_WHEEL_ITEMS}
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


