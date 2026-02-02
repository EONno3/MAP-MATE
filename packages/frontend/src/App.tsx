import React, { useEffect, useCallback, useState } from 'react'
import { MapCanvas } from './components/MapCanvas'
import { Toolbar } from './components/Toolbar'
import { Sidebar } from './components/Sidebar'
import { ParamPanel, GenerateParams } from './components/ParamPanel'
import { RoomEditor } from './components/room-editor'
import { ZonePanel } from './components/ZonePanel'
import { useMapState } from './hooks/useMapState'
import { translations, Translations } from './i18n/translations'
import { Room, EditorTool } from './types/map'
import { parseImportedMapJson } from './lib/mapSerialization'
import { buildUnityExportV1 } from './lib/unityExportV1'
import { useTileCatalog } from './hooks/useTileCatalog'

type EditMode = 'world' | 'room'

export default function App() {
  const BUILD_ID = 'fix-undo-ui-20260202'
  const [paramPanelOpen, setParamPanelOpen] = useState(true)
  const [zonePanelOpen, setZonePanelOpen] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>('world')
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [currentTool, setCurrentTool] = useState<EditorTool>('select')
  
  // 언어 토글 제거: UI/타일명은 한국어 기준으로 고정
  const t: Translations = translations.ko
  const tileCatalog = useTileCatalog({ t })
  
  const {
    mapData,
    loading,
    error,
    selectedRoomId,
    selectedRoomIds,
    hoveredRoomId,
    connections,
    selectedConnection,
    clipboard,
    mapVersion,
    canUndo,
    canRedo,
    undo,
    redo,
    fetchMap,
    fetchMapFromPrompt,
    importMap,
    setSelectedRoom,
    setHoveredRoom,
    updateRoom,
    updateRoomPositions,
    addRoom,
    deleteRoom,
    addConnection,
    deleteConnection,
    updateConnection,
    setSelectedConnection,
    setMapData,
    addZone,
    updateZone,
    deleteZone,
    splitRoom,
    toggleRoomSelection,
    setSelectedRooms,
    clearSelection,
    selectAllRooms,
    updateSelectedRooms,
    deleteSelectedRooms,
    copySelectedRooms,
    pasteRooms
  } = useMapState()

  // Fetch map on initial load
  useEffect(() => {
    fetchMap()
  }, [])

  // 전역 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // 상세맵 편집 모드에서는 다른 단축키 사용
      if (editMode === 'room') return

      // 텍스트 입력 중에는 브라우저 기본 undo(입력 되돌리기)를 우선
      const isTextEditing =
        target.isContentEditable ||
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' &&
          ['text', 'search', 'email', 'password', 'url', 'tel'].includes(
            ((target as HTMLInputElement).type || '').toLowerCase()
          ))

      // Ctrl/Cmd + 키 조합
      if (e.ctrlKey || e.metaKey) {
        // NOTE: e.key는 키보드 레이아웃/IME(한글 입력) 영향으로 'ㅋ'처럼 들어올 수 있어
        // 단축키는 물리 키 기준(e.code: KeyZ/KeyY/KeyC...)으로 처리한다.
        switch (e.code) {
          case 'KeyZ':
            if (isTextEditing) return
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'KeyY':
            if (isTextEditing) return
            e.preventDefault()
            redo()
            break
          case 'KeyC':
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
            e.preventDefault()
            copySelectedRooms()
            break
          case 'KeyV':
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
            e.preventDefault()
            pasteRooms()
            break
          case 'KeyA':
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
            e.preventDefault()
            selectAllRooms()
            break
        }
        return
      }

      // 입력/선택 UI 포커스 중엔 나머지 단축키(도구 변경 등) 무시
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      // 숫자키 단축키 (도구 전환)
      switch (e.key) {
        case '1':
          setCurrentTool('select')
          break
        case '2':
          setCurrentTool('draw')
          break
        case '3':
          setCurrentTool('connect')
          break
        case 'Escape':
          clearSelection()
          break
        case 'Delete':
        case 'Backspace':
          if (selectedRoomIds.length > 0 || selectedRoomId !== null) {
            deleteSelectedRooms()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editMode, undo, redo, copySelectedRooms, pasteRooms, selectAllRooms, clearSelection, deleteSelectedRooms, selectedRoomIds, selectedRoomId])

  // Handle generate from toolbar (random)
  const handleGenerate = useCallback(() => {
    const seed = Math.floor(Math.random() * 100000)
    fetchMap({ seed })
  }, [fetchMap])

  // Handle generate from param panel (with params)
  const handleGenerateWithParams = useCallback((params: GenerateParams) => {
    fetchMap({
      seed: params.seed ?? undefined,
      zoneCount: params.zoneCount,
      zoneSize: params.zoneSize,
      gateDensity: params.gateDensity
    })
  }, [fetchMap])

  // Handle export
  const handleExport = useCallback(() => {
    if (!mapData) return

    const exportData = {
      ...mapData,
      connections,
      tileCatalog: tileCatalog.state,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mapmate-export-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [mapData, connections, tileCatalog.state])

  // Handle export for Unity (v1)
  const handleExportUnity = useCallback(() => {
    if (!mapData) return

    try {
      const exportData = buildUnityExportV1(mapData, connections, { tilesEncoding: 'auto' })
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mapmate-unity-v1-${Date.now()}.mapmate.unity.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Unity 내보내기 실패: ${message}`)
    }
  }, [mapData, connections])

  // Handle import
  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const parsed = parseImportedMapJson(text)
        if ((parsed as any).tileCatalog) {
          tileCatalog.importTileCatalogState((parsed as any).tileCatalog)
        }
        importMap({ mapData: parsed.mapData, connections: parsed.connections })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        alert(`${t.failedToImport}: ${message}`)
      }
    }
    input.click()
  }, [importMap, t, tileCatalog])

  // Enter room editor mode
  const enterRoomEditor = useCallback((roomId: number) => {
    const room = mapData?.rooms.find(r => r.id === roomId)
    if (room) {
      setEditingRoom(room)
      setEditMode('room')
    }
  }, [mapData])

  // Exit room editor mode
  const exitRoomEditor = useCallback(() => {
    setEditMode('world')
    setEditingRoom(null)
  }, [])

  // Save room from editor
  const handleSaveRoom = useCallback((updatedRoom: Room) => {
    updateRoom(updatedRoom.id, updatedRoom)
    // Update editing room reference
    setEditingRoom(updatedRoom)
  }, [updateRoom])

  // Handle double click on room to enter editor
  const handleDoubleClickRoom = useCallback((roomId: number) => {
    enterRoomEditor(roomId)
  }, [enterRoomEditor])

  // Get selected room object
  const selectedRoom = mapData?.rooms.find(r => r.id === selectedRoomId) || null
  const selectedZone = selectedRoom ? mapData?.zones[selectedRoom.zone_id] || null : null
  
  // Get editing room zone
  const editingZone = editingRoom ? mapData?.zones[editingRoom.zone_id] || null : null

  // Room editor mode
  if (editMode === 'room' && editingRoom) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0d0d12',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #1a1a24;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
        
        <RoomEditor
          room={editingRoom}
          zone={editingZone}
          onBack={exitRoomEditor}
          onSave={handleSaveRoom}
          t={t}
          tileCatalog={tileCatalog}
        />
      </div>
    )
  }

  // World map mode
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#0d0d12',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Global Styles */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1a1a24;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      {/* Toolbar */}
      <Toolbar
        onGenerate={handleGenerate}
        onExport={handleExport}
        onExportUnity={handleExportUnity}
        onImport={handleImport}
        loading={loading}
        roomCount={mapData?.rooms.length || 0}
        t={t}
        buildId={BUILD_ID}
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Canvas Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {error && (
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#2d1a1a',
              borderBottom: '1px solid #4a2020',
              color: '#ff6b6b',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span>⚠️</span>
              <span>{error}</span>
              <button
                onClick={handleGenerate}
                style={{
                  marginLeft: 'auto',
                  padding: '4px 12px',
                  backgroundColor: '#4a2020',
                  border: 'none',
                  borderRadius: 4,
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                {t.retry}
              </button>
            </div>
          )}

          {/* Parameter Panel */}
          <ParamPanel
            onGenerate={handleGenerateWithParams}
            onGenerateFromPrompt={fetchMapFromPrompt}
            loading={loading}
            collapsed={!paramPanelOpen}
            onToggle={() => setParamPanelOpen(!paramPanelOpen)}
            t={t}
          />
          
          <MapCanvas
            mapData={mapData}
            connections={connections}
            selectedRoomId={selectedRoomId}
            selectedRoomIds={selectedRoomIds}
            hoveredRoomId={hoveredRoomId}
            selectedConnection={selectedConnection}
            onSelectRoom={setSelectedRoom}
            onToggleRoomSelection={toggleRoomSelection}
            onSetSelectedRooms={setSelectedRooms}
            onHoverRoom={setHoveredRoom}
            onUpdateRoom={updateRoom}
            onUpdateRoomPositions={updateRoomPositions}
            onAddConnection={addConnection}
            onDeleteConnection={deleteConnection}
            onSelectConnection={setSelectedConnection}
            onAddRoom={addRoom}
            onDeleteRoom={deleteRoom}
            onDoubleClickRoom={handleDoubleClickRoom}
            currentTool={currentTool}
            mapVersion={mapVersion}
            t={t}
          />
        </div>

        {/* Sidebar */}
        <Sidebar
          selectedRoom={selectedRoom}
          selectedRoomIds={selectedRoomIds}
          zone={selectedZone}
          zones={mapData?.zones || {}}
          selectedConnection={selectedConnection}
          connections={connections}
          rooms={mapData?.rooms || []}
          clipboard={clipboard}
          onUpdateRoom={updateRoom}
          onUpdateSelectedRooms={updateSelectedRooms}
          onDeleteRoom={deleteRoom}
          onDeleteSelectedRooms={deleteSelectedRooms}
          onDeleteConnection={deleteConnection}
          onUpdateConnection={updateConnection}
          onEditDetail={enterRoomEditor}
          onSplitRoom={splitRoom}
          onCopySelectedRooms={copySelectedRooms}
          onPasteRooms={pasteRooms}
          t={t}
        />

        {/* Zone Management Panel */}
        {mapData && (
          <ZonePanel
            zones={mapData.zones}
            onAddZone={addZone}
            onUpdateZone={updateZone}
            onDeleteZone={deleteZone}
            collapsed={!zonePanelOpen}
            onToggle={() => setZonePanelOpen(!zonePanelOpen)}
            t={t}
          />
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 20,
            animation: 'spin 2s linear infinite'
          }}>
            🗺️
          </div>
          <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
            {t.generating}
          </div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
            {t.generatingDescription}
          </div>
        </div>
      )}
    </div>
  )
}
