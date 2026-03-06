import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Room, RoomDetail, Zone, TileType, ObjectType, RoomObject, TILE_SIZE, TILES_PER_CHUNK_Y, TILES_PER_CHUNK_X, OBJECT_ICONS, Connection, MapData } from '../../types/map'
import { Translations } from '../../i18n/translations'
import { Undo2, Redo2, Layers, PenTool, Eraser, Square, Wrench, Plus, ChevronUp, ChevronDown, Play, AlertTriangle, Box, Lightbulb, Bot, Palette, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react'
import { RoomToolbar } from './RoomToolbar'
import { RoomCanvas, RoomToolMode } from './RoomCanvas'
import { TilePalette } from './TilePalette'
import { ObjectPalette } from './ObjectPalette'
import { TagEditor } from './TagEditor'
import { PlayTestMode } from './PlayTestMode'
import { RoomNavigator } from './RoomNavigator'
import { useHistory } from '../../hooks/useHistory'
import { RadialMenu, RadialMenuItem } from '../RadialMenu'
import type { TileCatalogApi } from '../../hooks/useTileCatalog'
import { selectTileKeyByDigitHotkey } from '../../lib/tileHotkeys'
// API URL
const API_URL = import.meta.env.VITE_API_URL || ''

interface RoomEditorProps {
  room: Room
  zone: Zone | null
  mapData: MapData | null
  connections?: Connection[]
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
    objects.push({ id: 'default_spawn', type: 'spawn_point', x: Math.floor(tileWidth / 2), y: tileHeight - 3 })
  } else if (room.type === 'save') {
    objects.push({ id: 'default_save', type: 'save_point', x: Math.floor(tileWidth / 2), y: tileHeight - 3 })
  } else if (room.type === 'boss') {
    objects.push({ id: 'default_enemy', type: 'enemy_spawn', x: Math.floor(tileWidth / 2), y: tileHeight - 3 })
  } else if (room.type === 'item') {
    objects.push({ id: 'default_chest', type: 'chest', x: Math.floor(tileWidth / 2), y: tileHeight - 3 })
  } else if (room.type === 'shop') {
    objects.push({ id: 'default_npc', type: 'npc', x: Math.floor(tileWidth / 2), y: tileHeight - 3 })
  }

  return {
    roomId: room.id,
    tileWidth,
    tileHeight,
    gridSize: 16,
    layers: [
      { id: 'layer_base', name: 'Base Terrain', type: 'tile', visible: true, opacity: 1, tiles },
      { id: 'layer_objects', name: 'Entities', type: 'object', visible: true, opacity: 1, objects }
    ]
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

export function RoomEditor({ room, zone, mapData, connections, onBack, onSave, t, tileCatalog }: RoomEditorProps) {
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
  const [isPlayingTest, setIsPlayingTest] = useState(false)
  const [activeLayerId, setActiveLayerId] = useState<string>('layer_base')
  const [selectedObjectInstance, setSelectedObjectInstance] = useState<string | null>(null)
  const [brushSize, setBrushSize] = useState(1)
  const [toolMode, setToolMode] = useState<RoomToolMode>('brush')
  const [activeTab, setActiveTab] = useState<'tiles' | 'objects' | 'layers'>('tiles')

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

  // Handle tiles update on active layer
  const handleUpdateActiveLayerTiles = useCallback((tiles: TileType[][], recordHistory: boolean = true) => {
    const newLayers = roomDetail.layers.map(l => l.id === activeLayerId && l.type === 'tile' ? { ...l, tiles } : l)
    setRoomDetailHistory({ ...roomDetail, layers: newLayers }, recordHistory)
    if (recordHistory) {
      setHasChanges(true)
    }
  }, [roomDetail, activeLayerId, setRoomDetailHistory])

  // Handle objects update on active layer
  const handleUpdateActiveLayerObjects = useCallback((objects: RoomObject[], recordHistory: boolean = true) => {
    const newLayers = roomDetail.layers.map(l => l.id === activeLayerId && l.type === 'object' ? { ...l, objects } : l)
    setRoomDetailHistory({ ...roomDetail, layers: newLayers }, recordHistory)
    if (recordHistory) {
      setHasChanges(true)
    }
  }, [roomDetail, activeLayerId, setRoomDetailHistory])

  const handleUpdateObjectProperties = useCallback((updatedObj: RoomObject) => {
    let newLayers = [...roomDetail.layers]
    let found = false
    for (let i = 0; i < newLayers.length; i++) {
      const layer = newLayers[i]
      if (layer.type === 'object' && layer.objects) {
        const idx = layer.objects.findIndex(o => o.id === updatedObj.id)
        if (idx >= 0) {
          const newObjects = [...layer.objects]
          newObjects[idx] = updatedObj
          newLayers[i] = { ...layer, objects: newObjects }
          found = true
          break
        }
      }
    }
    if (found) {
      setRoomDetailHistory({ ...roomDetail, layers: newLayers }, true)
      setHasChanges(true)
    }
  }, [roomDetail, setRoomDetailHistory])

  const selectedObjectData = useMemo(() => {
    if (!selectedObjectInstance) return null
    for (const l of roomDetail.layers) {
      if (l.type === 'object' && l.objects) {
        const obj = l.objects.find(o => o.id === selectedObjectInstance)
        if (obj) return obj
      }
    }
    return null
  }, [selectedObjectInstance, roomDetail.layers])

  // AI 프롬프트로 상세맵 생성
  const handleGenerateFromAI = useCallback(async () => {
    if (!aiPrompt.trim()) return

    setAiLoading(true)
    try {
      const response = await fetch(`${API_URL} /generate/room - detail`, {
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
        throw new Error(`Server error: ${response.status} `)
      }

      const data = await response.json()

      // API 응답을 RoomDetail로 변환
      let newLayers = [...roomDetail.layers]
      const baseLayerIndex = newLayers.findIndex(l => l.name === 'Base Terrain' && l.type === 'tile')
      if (baseLayerIndex !== -1 && data.tiles) {
        newLayers[baseLayerIndex] = { ...newLayers[baseLayerIndex], tiles: data.tiles }
      }

      const objLayerIndex = newLayers.findIndex(l => l.name === 'Entities' && l.type === 'object')
      if (objLayerIndex !== -1 && data.objects) {
        newLayers[objLayerIndex] = { ...newLayers[objLayerIndex], objects: data.objects }
      }

      const newDetail: RoomDetail = {
        roomId: room.id,
        tileWidth: roomDetail.tileWidth,
        tileHeight: roomDetail.tileHeight,
        gridSize: roomDetail.gridSize,
        layers: newLayers
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
    if (obj) {
      setActiveTab('objects')

      // Auto-switch to an object layer if current is not
      setActiveLayerId(prevId => {
        const currentLayer = roomDetail.layers.find(l => l.id === prevId)
        if (currentLayer && currentLayer.type === 'object') return prevId

        const objLayer = roomDetail.layers.find(l => l.type === 'object')
        return objLayer ? objLayer.id : prevId
      })
    }
  }, [roomDetail.layers])

  const handleSelectTile = useCallback((tile: TileType) => {
    setSelectedTile(tile)
    setSelectedObject(null) // Deselect object when switching to tile mode
    setActiveTab('tiles')

    // Auto-switch to a tile layer if current is not
    setActiveLayerId(prevId => {
      const currentLayer = roomDetail.layers.find(l => l.id === prevId)
      if (currentLayer && currentLayer.type === 'tile') return prevId

      const tileLayer = roomDetail.layers.find(l => l.type === 'tile')
      return tileLayer ? tileLayer.id : prevId
    })
  }, [roomDetail.layers])

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

      // Mnemonic Hotkeys (B, G, E)
      if (!isTextEditing && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.code === 'KeyB') {
          e.preventDefault()
          handleSelectTile(selectedTile === 'empty' ? 'solid' : selectedTile)
          setToolMode('brush')
          return
        }
        if (e.code === 'KeyG' || e.code === 'KeyF') {
          e.preventDefault()
          handleSelectTile(selectedTile)
          setToolMode('fill')
          return
        }
        if (e.code === 'KeyE') {
          e.preventDefault()
          handleSelectTile('empty')
          setToolMode('brush')
          return
        }
      }

      // 1 또는 2 키 길게 누르면 휠 표시
      if (!isTextEditing && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
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
      const target = e.target as HTMLElement
      const isTextEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if (!isTextEditing && e.key === '1' && !showTileWheel) {
        handleSelectTile(selectedTile)
      } else if (!isTextEditing && e.key === '2' && !showObjectWheel) {
        handleSelectObject(selectedObject || 'spawn_point')
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
      background: zone?.color ? `linear - gradient(to bottom right, ${zone.color}15, #0d0d12)` : '#0d0d12'
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
        {/* Left Panel (Tools & Palettes) */}
        <div className="panel-base animate-slide-in-left" style={{
          width: 320, flex: '0 0 320px', minWidth: 320,
          borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none',
          display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-panel)',
          zIndex: 10
        }}>
          {/* Tab Switcher (Tiles / Objects) */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-panel-hover)' }}>
            <button key="tab-tiles" onClick={() => { setActiveTab('tiles'); handleSelectTile(selectedTile); }} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === 'tiles' ? 'var(--accent-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'tiles' ? '2px solid var(--accent-blue)' : '2px solid transparent', fontWeight: activeTab === 'tiles' ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
              <Layers size={16} /> 타일 팔레트
            </button>
            <button key="tab-objects" onClick={() => { setActiveTab('objects'); handleSelectObject(selectedObject || 'spawn_point'); }} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === 'objects' ? 'var(--accent-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'objects' ? '2px solid var(--accent-blue)' : '2px solid transparent', fontWeight: activeTab === 'objects' ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
              <Box size={16} /> 오브젝트 팔레트
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* Tools Area */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Wrench size={14} /> 그리기 도구
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button key="tool-brush" onClick={() => { handleSelectTile(selectedTile === 'empty' ? 'solid' : selectedTile); setToolMode('brush') }} className={`btn - base ${toolMode === 'brush' && !selectedObject && selectedTile !== 'empty' ? 'btn-primary' : 'btn-secondary'} `} style={{ flex: 1, padding: '8px' }} title="붙이기 (B)"><PenTool size={14} /></button>
              <button key="tool-eraser" onClick={() => { handleSelectTile('empty'); setToolMode('brush') }} className={`btn - base ${toolMode === 'brush' && !selectedObject && selectedTile === 'empty' ? 'btn-primary' : 'btn-secondary'} `} style={{ flex: 1, padding: '8px', backgroundColor: toolMode === 'brush' && !selectedObject && selectedTile === 'empty' ? 'var(--accent-red)' : undefined }} title="지우개 (E)"><Eraser size={14} /></button>
              <button key="tool-fill" onClick={() => { handleSelectTile(selectedTile); setToolMode('fill') }} className={`btn - base ${toolMode === 'fill' && !selectedObject ? 'btn-primary' : 'btn-secondary'} `} style={{ flex: 1, padding: '8px', backgroundColor: toolMode === 'fill' && !selectedObject ? 'var(--accent-green)' : undefined, color: toolMode === 'fill' && !selectedObject ? '#000' : undefined }} title="채우기 (G)"><Square size={14} /></button>
            </div>

            {!selectedObject && toolMode === 'brush' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>브러시 크기</span>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, backgroundColor: 'var(--accent-blue)', padding: '2px 6px', borderRadius: 4 }}>{brushSize}×{brushSize}</span>
                </div>
                <input type="range" min="1" max="5" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>
            )}

            <div style={{ height: 1, backgroundColor: 'var(--border-light)', margin: '16px 0' }} />

            {/* Content Based on Left Tab */}
            {activeTab === 'tiles' && (
              <div className="animate-fade-in">
                {/* AI Generation Section (Tile specific) */}
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: 'rgba(124, 58, 237, 0.05)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 11, color: 'var(--accent-indigo)', marginBottom: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bot size={14} /> AI 맵 생성 (현재 영역 덮어쓰기)
                  </div>
                  <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="예: 플랫폼이 많은 수직 구조, 가시 함정 있음" className="input-base" style={{ width: '100%', minHeight: 60, resize: 'vertical', marginBottom: 8 }} />
                  <button onClick={handleGenerateFromAI} disabled={aiLoading || !aiPrompt.trim()} className="btn-base" style={{ width: '100%', padding: '8px', backgroundColor: aiLoading ? 'var(--bg-panel-hover)' : !aiPrompt.trim() ? 'var(--bg-panel)' : 'var(--accent-indigo)', color: '#fff', fontSize: 13 }}>
                    {aiLoading ? <><Loader2 size={14} className="animate-spin" /> 생성 중...</> : <><Palette size={14} /> AI 생성</>}
                  </button>
                </div>


                <TilePalette selectedTile={selectedTile} onSelectTile={handleSelectTile} tileColors={tileColorMap as any} t={t} tiles={tileItems.map((it) => ({ key: it.key, color: it.color, label: it.label }))} />

                {/* Tile Mgmt */}
                <div style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Palette size={14} /> 타일 색상/이름 관리
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tileItems.map((tile) => (
                      <div key={tile.key} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 8, borderBottom: '1px solid #333' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <div style={{ width: 18, height: 18, backgroundColor: tile.color, borderRadius: 4, border: tile.key === 'empty' ? '1px dashed #666' : '1px solid #444', flex: '0 0 auto' }} />
                          <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tile.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="color" value={tile.color as string} onChange={(e) => setTileColor(tile.key, e.target.value)} style={{ width: 34, height: 28, border: 'none', background: 'transparent', cursor: 'pointer' }} title={`${tile.key} 색상`} />
                          <button onClick={() => { const next = prompt('타일명(한국어)', tile.label) ?? ''; setTileName(tile.key, next); }} style={{ padding: '6px 8px', fontSize: 11, background: '#333', border: '1px solid #444', color: '#ddd', borderRadius: 6, cursor: 'pointer' }}>이름</button>
                          <button onClick={() => { if (tile.isBuiltin) return; const ok = confirm(`타일을 삭제할까요 ?\n\n - ${tile.label} \n - key: ${tile.key} `); if (ok) deleteTile(tile.key); }} disabled={tile.isBuiltin} style={{ padding: '6px 8px', fontSize: 11, background: tile.isBuiltin ? '#2a2a34' : '#3a1f1f', border: '1px solid #444', color: tile.isBuiltin ? '#666' : '#ffb4b4', borderRadius: 6, cursor: tile.isBuiltin ? 'not-allowed' : 'pointer' }}>삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #333' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600 }}>➕ 새 타일 추가</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input value={newTileName} onChange={(e) => setNewTileName(e.target.value)} placeholder="타일명" style={{ flex: 1, padding: '6px 8px', background: '#1a1a24', border: '1px solid #444', borderRadius: 6, color: '#fff', fontSize: 11 }} />
                      <input type="color" value={newTileColor} onChange={(e) => setNewTileColor(e.target.value)} style={{ width: 34, height: 34, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                    </div>
                    <button onClick={() => { addTile({ color: newTileColor, name: newTileName || undefined }); setNewTileName(''); }} style={{ width: '100%', padding: '8px', backgroundColor: '#3b82f6', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>새 타일 추가</button>
                  </div>
                  <button onClick={resetTileCatalog} className="btn-base btn-secondary" style={{ width: '100%', marginTop: 10, padding: '8px' }}>초기화</button>
                </div>
              </div>
            )}

            {activeTab === 'objects' && (
              <div className="animate-fade-in">
                <ObjectPalette selectedObject={selectedObject} onSelectObject={handleSelectObject} t={t} />
              </div>
            )}

            {/* Hint Footer */}
            <div style={{ marginTop: 24, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius-sm)', fontSize: 11, color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: 6, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}><Lightbulb size={14} /> 단축키 팁</div>
              <div>• B: 붙이기 / E: 지우기 / G: 채우기</div>
              <div>• Spacebar + 드래그: 지도 이동</div>
              <div>• 1/2키 길게: 퀵 방사형 메뉴</div>
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
          <RoomCanvas
            roomDetail={roomDetail}
            activeLayerId={activeLayerId}
            selectedTile={selectedTile}
            selectedObject={selectedObject}
            brushSize={brushSize}
            toolMode={toolMode}
            onUpdateActiveLayerTiles={handleUpdateActiveLayerTiles}
            onUpdateActiveLayerObjects={handleUpdateActiveLayerObjects}
            selectedObjectInstance={selectedObjectInstance}
            onSelectObjectInstance={setSelectedObjectInstance}
            tileColors={tileColorMap as any}
            t={t}
          />
        </div>

        {/* Right Panel (Layers, Props, Global Actions) */}
        <div className="panel-base" style={{
          width: 340, flex: '0 0 340px', minWidth: 340,
          borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none',
          padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-panel)'
        }}>
          {/* Top Global Actions */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button key="btn-undo" onClick={undo} disabled={!canUndo} title={`${t.undo} (Ctrl + Z)`} className="btn-base" style={{ flex: 1, padding: '8px', backgroundColor: canUndo ? 'var(--bg-panel-hover)' : 'transparent', color: canUndo ? 'var(--text-main)' : 'var(--text-muted)' }}>
                <Undo2 size={16} /> {t.undo}
              </button>
              <button key="btn-redo" onClick={redo} disabled={!canRedo} title={`${t.redo} (Ctrl + Y)`} className="btn-base" style={{ flex: 1, padding: '8px', backgroundColor: canRedo ? 'var(--bg-panel-hover)' : 'transparent', color: canRedo ? 'var(--text-main)' : 'var(--text-muted)' }}>
                <Redo2 size={16} /> {t.redo}
              </button>
            </div>

            <button key="btn-playtest" onClick={() => setIsPlayingTest(true)} className="btn-base" style={{ width: '100%', padding: '8px', backgroundColor: 'var(--accent-green)', color: '#000', fontWeight: 'bold' }}>
              <Play size={16} fill="#000" /> 플레이 테스트
            </button>

            {hasChanges && (
              <div style={{ padding: 8, backgroundColor: 'rgba(248, 113, 113, 0.1)', borderRadius: 'var(--border-radius-sm)', fontSize: 11, color: 'var(--accent-red)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> {t.unsavedChangesIndicator}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* Properties / Tag Editor */}
            {selectedObjectData && (
              <div className="animate-fade-in" style={{ marginBottom: 16 }}>
                <TagEditor
                  object={selectedObjectData}
                  onUpdate={handleUpdateObjectProperties}
                  onClose={() => setSelectedObjectInstance(null)}
                />
              </div>
            )}

            {/* Layers Area */}
            <div style={{ fontSize: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border-light)' }}>
              <Layers size={14} /> 레이어 관리
            </div>

            <div className="animate-fade-in">
              <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <button key="btn-layer-tile" onClick={() => {
                  const id = `layer_${Date.now()} `
                  const newLayers = [...roomDetail.layers, { id, name: `타일 레이어 ${roomDetail.layers.length} `, type: 'tile' as const, visible: true, opacity: 1, tiles: generateDefaultRoomDetail(room).layers[0].tiles }]
                  setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                  setActiveLayerId(id)
                  setHasChanges(true)
                }} className="btn-base btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 12 }}>
                  <Plus size={14} /> 타일
                </button>
                <button key="btn-layer-object" onClick={() => {
                  const id = `layer_${Date.now()} `
                  const newLayers = [...roomDetail.layers, { id, name: `오브젝트 레이어 ${roomDetail.layers.length} `, type: 'object' as const, visible: true, opacity: 1, objects: [] }]
                  setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                  setActiveLayerId(id)
                  setHasChanges(true)
                }} className="btn-base btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 12 }}>
                  <Plus size={14} /> 오브젝트
                </button>
                <button key="btn-layer-image" onClick={() => {
                  const id = `layer_${Date.now()} `
                  const newLayers = [...roomDetail.layers, { id, name: `이미지 레이어 ${roomDetail.layers.length} `, type: 'image' as const, visible: true, opacity: 0.5, imageUrl: '' }]
                  setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                  setActiveLayerId(id)
                  setHasChanges(true)
                }} className="btn-base btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 12 }}>
                  <Plus size={14} /> 이미지
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {roomDetail.layers.slice().reverse().map((layer) => {
                  const actualIdx = roomDetail.layers.findIndex(l => l.id === layer.id)
                  const canMoveUp = actualIdx < roomDetail.layers.length - 1
                  const canMoveDown = actualIdx > 0

                  return (
                    <div key={layer.id} onClick={() => setActiveLayerId(layer.id)} style={{ padding: 12, backgroundColor: activeLayerId === layer.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)', border: activeLayerId === layer.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <button
                          disabled={!canMoveUp}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!canMoveUp) return
                            const newLayers = [...roomDetail.layers]
                            const temp = newLayers[actualIdx]
                            newLayers[actualIdx] = newLayers[actualIdx + 1]
                            newLayers[actualIdx + 1] = temp
                            setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                            setHasChanges(true)
                          }}
                          className="btn-base" style={{ padding: 2, background: 'transparent', color: canMoveUp ? '#fff' : 'var(--text-muted)' }} title="레이어 위로 이동"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          disabled={!canMoveDown}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!canMoveDown) return
                            const newLayers = [...roomDetail.layers]
                            const temp = newLayers[actualIdx]
                            newLayers[actualIdx] = newLayers[actualIdx - 1]
                            newLayers[actualIdx - 1] = temp
                            setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                            setHasChanges(true)
                          }}
                          className="btn-base" style={{ padding: 2, background: 'transparent', color: canMoveDown ? '#fff' : 'var(--text-muted)' }} title="레이어 아래로 이동"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: layer.type === 'tile' ? 'rgba(34, 197, 94, 0.2)' : layer.type === 'object' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                            color: layer.type === 'tile' ? '#4ade80' : layer.type === 'object' ? '#818cf8' : '#f472b6',
                            textTransform: 'uppercase'
                          }}>{layer.type}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{layer.name}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          const newLayers = roomDetail.layers.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)
                          setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                          setHasChanges(true)
                        }} className="btn-base" style={{ padding: 6, background: 'transparent', color: layer.visible ? '#fff' : 'var(--text-muted)' }} title={layer.visible ? "숨기기" : "보이기"}>
                          {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button onClick={(e) => {
                          e.stopPropagation()
                          if (roomDetail.layers.length <= 1) return alert('최소 1개의 레이어가 필요합니다.')
                          if (confirm(`'${layer.name}' 레이어를 삭제할까요 ? `)) {
                            const newLayers = roomDetail.layers.filter(l => l.id !== layer.id)
                            setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                            if (activeLayerId === layer.id) setActiveLayerId(newLayers[newLayers.length - 1].id)
                            setHasChanges(true)
                          }
                        }} className="btn-base" style={{ padding: 6, color: 'var(--accent-red)', background: 'transparent' }} title="삭제">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {(() => {
                const activeLayer = roomDetail.layers.find(l => l.id === activeLayerId)
                if (!activeLayer) return null
                return (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>{activeLayer.name} 속성</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>불투명도</span>
                      <input type="range" min="0" max="1" step="0.1" value={activeLayer.opacity} onChange={(e) => {
                        const newLayers = roomDetail.layers.map(l => l.id === activeLayer.id ? { ...l, opacity: parseFloat(e.target.value) } : l)
                        setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                        setHasChanges(true)
                      }} style={{ flex: 1 }} />
                      <span style={{ fontSize: 11 }}>{Math.round(activeLayer.opacity * 100)}%</span>
                    </div>
                    {activeLayer.type === 'image' && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>이미지 URL (또는 Data URI)</div>
                        <input type="text" className="input-base" style={{ width: '100%', fontSize: 11, padding: '6px 8px' }} value={activeLayer.imageUrl || ''} onChange={(e) => {
                          const newLayers = roomDetail.layers.map(l => l.id === activeLayer.id ? { ...l, imageUrl: e.target.value } : l)
                          setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                          setHasChanges(true)
                        }} placeholder="https://..." />
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Navigation Guide (Mini-map) */}
              {mapData && <RoomNavigator mapData={mapData} currentRoom={room} connections={connections} />}
            </div>
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

      {isPlayingTest && (
        <PlayTestMode roomDetail={roomDetail} onClose={() => setIsPlayingTest(false)} tileColors={tileColorMap as any} />
      )}
    </div>
  )
}

export { generateDefaultRoomDetail }


