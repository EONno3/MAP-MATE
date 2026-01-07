import React, { useEffect, useCallback, useState } from 'react'
import { MapCanvas } from './components/MapCanvas'
import { Toolbar } from './components/Toolbar'
import { Sidebar } from './components/Sidebar'
import { ParamPanel, GenerateParams } from './components/ParamPanel'
import { RoomEditor } from './components/room-editor'
import { ZonePanel } from './components/ZonePanel'
import { useMapState } from './hooks/useMapState'
import { translations, Language, Translations } from './i18n/translations'
import { Room, EditorTool } from './types/map'

type EditMode = 'world' | 'room'

export default function App() {
  const [paramPanelOpen, setParamPanelOpen] = useState(true)
  const [zonePanelOpen, setZonePanelOpen] = useState(false)
  const [language, setLanguage] = useState<Language>('ko') // Default to Korean
  const [editMode, setEditMode] = useState<EditMode>('world')
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [currentTool, setCurrentTool] = useState<EditorTool>('select')
  
  const t: Translations = translations[language]
  
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
    setSelectedRoom,
    setHoveredRoom,
    updateRoom,
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
      // 입력 필드에서는 단축키 무시
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      // 상세맵 편집 모드에서는 다른 단축키 사용
      if (editMode === 'room') return

      // Ctrl/Cmd + 키 조합
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 'c':
            e.preventDefault()
            copySelectedRooms()
            break
          case 'v':
            e.preventDefault()
            pasteRooms()
            break
          case 'a':
            e.preventDefault()
            selectAllRooms()
            break
        }
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
        const data = JSON.parse(text)
        
        // Validate basic structure
        if (!data.rooms || !data.zones) {
          throw new Error(t.invalidMapFormat)
        }

        setMapData(data)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        alert(`${t.failedToImport}: ${message}`)
      }
    }
    input.click()
  }, [setMapData, t])

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
        onImport={handleImport}
        loading={loading}
        roomCount={mapData?.rooms.length || 0}
        t={t}
        language={language}
        onLanguageChange={setLanguage}
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
