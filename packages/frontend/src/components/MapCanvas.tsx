import React, { useRef, useEffect, useCallback, useState } from 'react'
import { MapData, Room, Connection, ROOM_TYPE_ICONS, GATE_COLORS, Point, EditorTool, GateCondition } from '../types/map'
import { useCanvasTransform } from '../hooks/useCanvasTransform'
import { Tooltip } from './Tooltip'
import { Translations } from '../i18n/translations'

const CELL_SIZE = 40

// 선택된 연결선 타입
interface SelectedConnection {
  fromId: number
  toId: number
}

interface MapCanvasProps {
  mapData: MapData | null
  connections: Connection[]
  selectedRoomId: number | null
  selectedRoomIds: number[]  // 다중 선택
  hoveredRoomId: number | null
  selectedConnection: SelectedConnection | null
  onSelectRoom: (id: number | null) => void
  onToggleRoomSelection: (id: number) => void  // Ctrl+클릭 다중 선택
  onSetSelectedRooms: (ids: number[]) => void  // 선택 일괄 설정
  onHoverRoom: (id: number | null) => void
  onUpdateRoom?: (id: number, updates: Partial<Room>, recordHistory?: boolean) => void
  onAddConnection?: (fromId: number, toId: number) => void
  onDeleteConnection?: (fromId: number, toId: number) => void
  onSelectConnection?: (conn: SelectedConnection | null) => void
  onAddRoom?: (room: Room) => void
  onDeleteRoom?: (id: number) => void
  onDoubleClickRoom?: (roomId: number) => void
  currentTool?: EditorTool
  mapVersion?: number  // 새 맵 생성 시에만 fitToView 호출
  t: Translations
}

export function MapCanvas({
  mapData,
  connections,
  selectedRoomId,
  selectedRoomIds,
  hoveredRoomId,
  selectedConnection,
  onSelectRoom,
  onToggleRoomSelection,
  onSetSelectedRooms,
  onHoverRoom,
  onUpdateRoom,
  onAddConnection,
  onDeleteConnection,
  onSelectConnection,
  onAddRoom,
  onDeleteRoom,
  onDoubleClickRoom,
  currentTool = 'select',
  mapVersion = 0,
  t
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  
  // Drag state (moving room)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null)
  const [dragRoomOriginalPos, setDragRoomOriginalPos] = useState<{ x: number; y: number } | null>(null)
  
  // Connection creation state
  const [connectingFromId, setConnectingFromId] = useState<number | null>(null)
  
  // Draw mode state (creating room by dragging)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStartCell, setDrawStartCell] = useState<Point | null>(null)
  const [drawCurrentCell, setDrawCurrentCell] = useState<Point | null>(null)

  const {
    transform,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    screenToWorld,
    fitToView,
    isPanning
  } = useCanvasTransform()

  // Get room at screen position
  const getRoomAtPosition = useCallback((screenX: number, screenY: number): Room | null => {
    if (!mapData) return null

    const worldPos = screenToWorld(screenX, screenY)
    const cellX = worldPos.x / CELL_SIZE
    const cellY = worldPos.y / CELL_SIZE

    // Check each room (reverse order to get top-most first)
    for (let i = mapData.rooms.length - 1; i >= 0; i--) {
      const room = mapData.rooms[i]
      if (room.rects && room.rects.length > 0) {
        for (const [rx, ry, rw, rh] of room.rects) {
          const absX = room.x + rx
          const absY = room.y + ry
          if (cellX >= absX && cellX < absX + rw && cellY >= absY && cellY < absY + rh) {
            return room
          }
        }
      } else {
        if (cellX >= room.x && cellX < room.x + room.w &&
            cellY >= room.y && cellY < room.y + room.h) {
          return room
        }
      }
    }

    return null
  }, [mapData, screenToWorld])

  // Get connection at screen position (점과 선 사이 거리 계산)
  const getConnectionAtPosition = useCallback((screenX: number, screenY: number): Connection | null => {
    if (!mapData || !connections.length) return null

    const worldPos = screenToWorld(screenX, screenY)
    const threshold = 10 / transform.scale // 클릭 허용 거리 (줌 레벨에 따라 조정)

    for (const conn of connections) {
      const fromRoom = mapData.rooms.find(r => r.id === conn.fromId)
      const toRoom = mapData.rooms.find(r => r.id === conn.toId)
      if (!fromRoom || !toRoom) continue

      const fromCenterX = (fromRoom.x + fromRoom.w / 2) * CELL_SIZE
      const fromCenterY = (fromRoom.y + fromRoom.h / 2) * CELL_SIZE
      const toCenterX = (toRoom.x + toRoom.w / 2) * CELL_SIZE
      const toCenterY = (toRoom.y + toRoom.h / 2) * CELL_SIZE

      // 점과 선분 사이 거리 계산
      const dx = toCenterX - fromCenterX
      const dy = toCenterY - fromCenterY
      const lengthSq = dx * dx + dy * dy

      if (lengthSq === 0) continue

      // 선분 위 가장 가까운 점의 파라미터 t
      let t = ((worldPos.x - fromCenterX) * dx + (worldPos.y - fromCenterY) * dy) / lengthSq
      t = Math.max(0, Math.min(1, t))

      // 가장 가까운 점
      const closestX = fromCenterX + t * dx
      const closestY = fromCenterY + t * dy

      // 거리 계산
      const distSq = (worldPos.x - closestX) ** 2 + (worldPos.y - closestY) ** 2
      if (distSq < threshold ** 2) {
        return conn
      }
    }

    return null
  }, [mapData, connections, screenToWorld, transform.scale])

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !mapData) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to container size
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Clear
    ctx.fillStyle = '#0d0d12'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply transform
    ctx.save()
    ctx.translate(transform.offsetX, transform.offsetY)
    ctx.scale(transform.scale, transform.scale)

    const { rooms, zones } = mapData

    // Draw grid (subtle)
    ctx.strokeStyle = '#1a1a24'
    ctx.lineWidth = 1 / transform.scale
    const gridSize = CELL_SIZE
    const startX = Math.floor(-transform.offsetX / transform.scale / gridSize) * gridSize
    const startY = Math.floor(-transform.offsetY / transform.scale / gridSize) * gridSize
    const endX = startX + (canvas.width / transform.scale) + gridSize * 2
    const endY = startY + (canvas.height / transform.scale) + gridSize * 2

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
      ctx.stroke()
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }

    // Draw connections first (behind rooms)
    connections.forEach(conn => {
      const fromRoom = rooms.find(r => r.id === conn.fromId)
      const toRoom = rooms.find(r => r.id === conn.toId)
      if (!fromRoom || !toRoom) return

      const fromCenterX = (fromRoom.x + fromRoom.w / 2) * CELL_SIZE
      const fromCenterY = (fromRoom.y + fromRoom.h / 2) * CELL_SIZE
      const toCenterX = (toRoom.x + toRoom.w / 2) * CELL_SIZE
      const toCenterY = (toRoom.y + toRoom.h / 2) * CELL_SIZE

      // 선택된 연결선인지 확인
      const isSelected = selectedConnection && 
        ((conn.fromId === selectedConnection.fromId && conn.toId === selectedConnection.toId) ||
         (conn.fromId === selectedConnection.toId && conn.toId === selectedConnection.fromId))

      ctx.beginPath()
      
      if (isSelected) {
        // 선택된 연결선: 노란색, 두껍게
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 5 / transform.scale
        ctx.setLineDash([])
      } else {
        ctx.strokeStyle = GATE_COLORS[conn.condition] || '#444'
        ctx.lineWidth = (conn.condition === 'none' ? 2 : 3) / transform.scale
        
        if (conn.condition !== 'none') {
          ctx.setLineDash([8 / transform.scale, 4 / transform.scale])
        } else {
          ctx.setLineDash([])
        }
      }

      ctx.moveTo(fromCenterX, fromCenterY)
      ctx.lineTo(toCenterX, toCenterY)
      ctx.stroke()
      ctx.setLineDash([])

      // 선택된 연결선에 조건 라벨 표시
      if (isSelected && conn.condition !== 'none') {
        const midX = (fromCenterX + toCenterX) / 2
        const midY = (fromCenterY + toCenterY) / 2
        
        ctx.fillStyle = '#1a1a24'
        ctx.fillRect(midX - 30 / transform.scale, midY - 10 / transform.scale, 60 / transform.scale, 20 / transform.scale)
        
        ctx.font = `bold ${12 / transform.scale}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = GATE_COLORS[conn.condition]
        ctx.fillText(conn.condition, midX, midY)
      }
    })

    // Draw connection preview line if connecting
    if (connectingFromId !== null) {
      const fromRoom = rooms.find(r => r.id === connectingFromId)
      if (fromRoom) {
        const fromCenterX = (fromRoom.x + fromRoom.w / 2) * CELL_SIZE
        const fromCenterY = (fromRoom.y + fromRoom.h / 2) * CELL_SIZE
        const worldMouse = screenToWorld(mousePos.x, mousePos.y)

        ctx.beginPath()
        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 2 / transform.scale
        ctx.setLineDash([6 / transform.scale, 3 / transform.scale])
        ctx.moveTo(fromCenterX, fromCenterY)
        ctx.lineTo(worldMouse.x, worldMouse.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Draw rooms
    rooms.forEach(room => {
      const zone = zones[room.zone_id]
      const isSelected = room.id === selectedRoomId
      const isMultiSelected = selectedRoomIds.includes(room.id)  // 다중 선택
      const isHovered = room.id === hoveredRoomId
      const isConnectingFrom = room.id === connectingFromId
      
      // Zone 색상만 사용 (room type 오버라이드 제거)
      const baseColor = zone?.color || '#555'

      // Draw room rects
      if (room.rects && room.rects.length > 0) {
        room.rects.forEach(([rx, ry, rw, rh]) => {
          const absX = (room.x + rx) * CELL_SIZE
          const absY = (room.y + ry) * CELL_SIZE
          const w = rw * CELL_SIZE
          const h = rh * CELL_SIZE

          // Fill
          ctx.fillStyle = baseColor
          ctx.globalAlpha = isHovered || isDragging && (isSelected || isMultiSelected) ? 0.9 : 0.7
          ctx.fillRect(absX, absY, w, h)
          ctx.globalAlpha = 1

          // Border - 다중 선택은 시안색
          ctx.strokeStyle = isSelected ? '#ffff00' : 
                           isMultiSelected ? '#00ffff' :
                           isConnectingFrom ? '#00ff00' :
                           isHovered ? '#ffffff' : '#888'
          ctx.lineWidth = (isSelected || isMultiSelected || isHovered || isConnectingFrom ? 3 : 1.5) / transform.scale
          ctx.strokeRect(absX, absY, w, h)
        })
      } else {
        const rx = room.x * CELL_SIZE
        const ry = room.y * CELL_SIZE
        const rw = room.w * CELL_SIZE
        const rh = room.h * CELL_SIZE

        ctx.fillStyle = baseColor
        ctx.globalAlpha = isHovered || isDragging && (isSelected || isMultiSelected) ? 0.9 : 0.7
        ctx.fillRect(rx, ry, rw, rh)
        ctx.globalAlpha = 1

        ctx.strokeStyle = isSelected ? '#ffff00' :
                         isMultiSelected ? '#00ffff' :
                         isConnectingFrom ? '#00ff00' :
                         isHovered ? '#ffffff' : '#888'
        ctx.lineWidth = (isSelected || isMultiSelected || isHovered || isConnectingFrom ? 3 : 1.5) / transform.scale
        ctx.strokeRect(rx, ry, rw, rh)
      }

      // Draw room type icon/label
      const icon = ROOM_TYPE_ICONS[room.type]
      if (icon) {
        const cx = (room.x + room.w / 2) * CELL_SIZE
        const cy = (room.y + room.h / 2) * CELL_SIZE
        
        ctx.font = `${24 / transform.scale}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(icon, cx, cy)
      } else if (room.type !== 'normal') {
        const cx = (room.x + room.w / 2) * CELL_SIZE
        const cy = (room.y + room.h / 2) * CELL_SIZE
        
        ctx.font = `bold ${12 / transform.scale}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(room.type.toUpperCase(), cx, cy)
      }
    })

    // Draw room creation preview (draw mode)
    if (isDrawing && drawStartCell && drawCurrentCell) {
      const minX = Math.min(drawStartCell.x, drawCurrentCell.x)
      const minY = Math.min(drawStartCell.y, drawCurrentCell.y)
      const maxX = Math.max(drawStartCell.x, drawCurrentCell.x)
      const maxY = Math.max(drawStartCell.y, drawCurrentCell.y)
      
      const previewX = minX * CELL_SIZE
      const previewY = minY * CELL_SIZE
      const previewW = (maxX - minX + 1) * CELL_SIZE
      const previewH = (maxY - minY + 1) * CELL_SIZE
      
      // Fill preview
      ctx.fillStyle = '#4CAF50'
      ctx.globalAlpha = 0.3
      ctx.fillRect(previewX, previewY, previewW, previewH)
      ctx.globalAlpha = 1
      
      // Border
      ctx.strokeStyle = '#4CAF50'
      ctx.lineWidth = 2 / transform.scale
      ctx.setLineDash([6 / transform.scale, 3 / transform.scale])
      ctx.strokeRect(previewX, previewY, previewW, previewH)
      ctx.setLineDash([])
      
      // Size label
      const sizeW = maxX - minX + 1
      const sizeH = maxY - minY + 1
      const labelX = previewX + previewW / 2
      const labelY = previewY + previewH / 2
      
      ctx.font = `bold ${16 / transform.scale}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${sizeW} × ${sizeH}`, labelX, labelY)
    }

    ctx.restore()

    // Draw zoom level and tool indicator
    ctx.fillStyle = '#666'
    ctx.font = '12px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${t.zoom}: ${Math.round(transform.scale * 100)}%`, canvas.width - 10, canvas.height - 10)
    
    if (isDragging) {
      ctx.fillStyle = '#4CAF50'
      ctx.fillText(t.dragging, canvas.width - 10, canvas.height - 26)
    } else if (connectingFromId !== null) {
      ctx.fillStyle = '#00ff00'
      ctx.fillText(t.clickToConnect, canvas.width - 10, canvas.height - 26)
    }

  }, [mapData, connections, selectedRoomId, selectedRoomIds, hoveredRoomId, selectedConnection, transform, isDragging, connectingFromId, mousePos, screenToWorld, isDrawing, drawStartCell, drawCurrentCell, t])

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })
    setTooltipPos({ x: e.clientX, y: e.clientY })

    // Handle drawing room
    if (isDrawing && drawStartCell) {
      const worldPos = screenToWorld(x, y)
      const cellX = Math.floor(worldPos.x / CELL_SIZE)
      const cellY = Math.floor(worldPos.y / CELL_SIZE)
      setDrawCurrentCell({ x: cellX, y: cellY })
      return
    }

    // Handle dragging room
    if (isDragging && selectedRoomId !== null && dragStartPos && dragRoomOriginalPos && onUpdateRoom) {
      const currentWorld = screenToWorld(x, y)
      const startWorld = screenToWorld(dragStartPos.x, dragStartPos.y)
      
      const dx = Math.round((currentWorld.x - startWorld.x) / CELL_SIZE)
      const dy = Math.round((currentWorld.y - startWorld.y) / CELL_SIZE)
      
      const newX = dragRoomOriginalPos.x + dx
      const newY = dragRoomOriginalPos.y + dy
      
      onUpdateRoom(selectedRoomId, { x: newX, y: newY }, false) // Don't record history while dragging
    }
    
    // Handle panning
    updatePan(e)

    // Update hovered room (not while dragging/drawing)
    if (!isDragging && !isDrawing) {
      const room = getRoomAtPosition(x, y)
      onHoverRoom(room?.id || null)
    }
  }, [isDragging, isDrawing, drawStartCell, selectedRoomId, dragStartPos, dragRoomOriginalPos, onUpdateRoom, updatePan, getRoomAtPosition, onHoverRoom, screenToWorld])

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return // Don't click while dragging
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const room = getRoomAtPosition(x, y)
    
    // Handle connection mode (Ctrl+클릭은 다중 선택으로 변경, 연결은 도구로만)
    if (currentTool === 'connect') {
      if (connectingFromId === null) {
        if (room) {
          setConnectingFromId(room.id)
        }
      } else {
        if (room && room.id !== connectingFromId && onAddConnection) {
          onAddConnection(connectingFromId, room.id)
        }
        setConnectingFromId(null)
      }
      return
    }
    
    // 방을 클릭한 경우
    if (room) {
      // Ctrl+클릭: 다중 선택 토글
      if (e.ctrlKey || e.metaKey) {
        onToggleRoomSelection(room.id)
      } else {
        // 일반 클릭: 단일 선택
        onSelectRoom(room.id)
        onSetSelectedRooms([])  // 다중 선택 해제
      }
      if (onSelectConnection) {
        onSelectConnection(null) // 연결선 선택 해제
      }
      return
    }
    
    // 연결선 클릭 확인 (방이 없는 경우에만)
    const connection = getConnectionAtPosition(x, y)
    if (connection && onSelectConnection) {
      onSelectConnection({ fromId: connection.fromId, toId: connection.toId })
      onSelectRoom(null) // 방 선택 해제
      onSetSelectedRooms([])  // 다중 선택 해제
      return
    }
    
    // 빈 공간 클릭: 모든 선택 해제
    onSelectRoom(null)
    onSetSelectedRooms([])
    if (onSelectConnection) {
      onSelectConnection(null)
    }
  }, [isDragging, getRoomAtPosition, getConnectionAtPosition, currentTool, connectingFromId, onAddConnection, onSelectRoom, onToggleRoomSelection, onSetSelectedRooms, onSelectConnection])

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Middle mouse or Shift+Left for panning
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault()
      startPan(e)
      return
    }
    
    // Draw mode - start drawing room
    if (e.button === 0 && currentTool === 'draw') {
      const room = getRoomAtPosition(x, y)
      if (!room) { // Only start drawing on empty space
        const worldPos = screenToWorld(x, y)
        const cellX = Math.floor(worldPos.x / CELL_SIZE)
        const cellY = Math.floor(worldPos.y / CELL_SIZE)
        setIsDrawing(true)
        setDrawStartCell({ x: cellX, y: cellY })
        setDrawCurrentCell({ x: cellX, y: cellY })
      }
      return
    }
    
    // Left click on selected room starts drag
    if (e.button === 0 && !e.ctrlKey && currentTool === 'select') {
      const room = getRoomAtPosition(x, y)
      if (room && room.id === selectedRoomId) {
        setIsDragging(true)
        setDragStartPos({ x, y })
        setDragRoomOriginalPos({ x: room.x, y: room.y })
      }
    }
  }, [startPan, getRoomAtPosition, selectedRoomId, currentTool, screenToWorld])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Finish drawing - create new room
    if (isDrawing && drawStartCell && drawCurrentCell && onAddRoom && mapData) {
      const minX = Math.min(drawStartCell.x, drawCurrentCell.x)
      const minY = Math.min(drawStartCell.y, drawCurrentCell.y)
      const maxX = Math.max(drawStartCell.x, drawCurrentCell.x)
      const maxY = Math.max(drawStartCell.y, drawCurrentCell.y)
      
      const w = maxX - minX + 1
      const h = maxY - minY + 1
      
      // Only create if size is at least 1x1
      if (w >= 1 && h >= 1) {
        const maxId = Math.max(...mapData.rooms.map(r => r.id), 0)
        const newRoom: Room = {
          id: maxId + 1,
          x: minX,
          y: minY,
          w,
          h,
          zone_id: 1,
          type: 'normal',
          rects: [[0, 0, w, h]],
          neighbors: []
        }
        
        onAddRoom(newRoom)
        onSelectRoom(newRoom.id)
      }
      
      setIsDrawing(false)
      setDrawStartCell(null)
      setDrawCurrentCell(null)
      return
    }
    
    // Finish dragging room - record history
    if (isDragging && selectedRoomId !== null && onUpdateRoom) {
      // Record the final position in history
      const room = mapData?.rooms.find(r => r.id === selectedRoomId)
      if (room) {
        onUpdateRoom(selectedRoomId, { x: room.x, y: room.y }, true)
      }
      setIsDragging(false)
      setDragStartPos(null)
      setDragRoomOriginalPos(null)
    }
    
    endPan()
  }, [isDrawing, isDragging, drawStartCell, drawCurrentCell, selectedRoomId, onAddRoom, onUpdateRoom, onSelectRoom, mapData, endPan])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false)
      setDrawStartCell(null)
      setDrawCurrentCell(null)
    }
    if (isDragging) {
      setIsDragging(false)
      setDragStartPos(null)
      setDragRoomOriginalPos(null)
    }
    endPan()
    onHoverRoom(null)
  }, [isDrawing, isDragging, endPan, onHoverRoom])

  // Handle double click (add new room)
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Check if clicking on existing room
    const existingRoom = getRoomAtPosition(x, y)
    
    if (existingRoom) {
      // Double click on room -> enter room detail editor
      if (onDoubleClickRoom) {
        onDoubleClickRoom(existingRoom.id)
      }
      return
    }
    
    // Double click on empty space -> add new room
    if (!onAddRoom || !mapData) return
    
    const worldPos = screenToWorld(x, y)
    const cellX = Math.floor(worldPos.x / CELL_SIZE)
    const cellY = Math.floor(worldPos.y / CELL_SIZE)
    
    // Generate new room ID
    const maxId = Math.max(...mapData.rooms.map(r => r.id), 0)
    const newRoom: Room = {
      id: maxId + 1,
      x: cellX,
      y: cellY,
      w: 4,
      h: 4,
      zone_id: 1, // Default zone
      type: 'normal',
      rects: [[0, 0, 4, 4]],
      neighbors: []
    }
    
    onAddRoom(newRoom)
    onSelectRoom(newRoom.id)
  }, [onAddRoom, onDoubleClickRoom, mapData, getRoomAtPosition, screenToWorld, onSelectRoom])

  // Handle key press (ESC to cancel, Delete to remove)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingFromId(null)
        setIsDragging(false)
        setIsDrawing(false)
        setDrawStartCell(null)
        setDrawCurrentCell(null)
        // ESC로 선택 해제
        if (onSelectConnection) {
          onSelectConnection(null)
        }
      }
      
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        // Don't delete if typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT' || 
            (e.target as HTMLElement).tagName === 'TEXTAREA' ||
            (e.target as HTMLElement).tagName === 'SELECT') return
        
        // 연결선 삭제
        if (selectedConnection && onDeleteConnection) {
          onDeleteConnection(selectedConnection.fromId, selectedConnection.toId)
          if (onSelectConnection) {
            onSelectConnection(null)
          }
          return
        }
        
        // 방 삭제
        if (selectedRoomId !== null && onDeleteRoom) {
          onDeleteRoom(selectedRoomId)
          onSelectRoom(null)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRoomId, selectedConnection, onDeleteRoom, onDeleteConnection, onSelectRoom, onSelectConnection])

  // Attach wheel event listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      handleWheel(e)
    }

    container.addEventListener('wheel', wheelHandler, { passive: false })
    return () => container.removeEventListener('wheel', wheelHandler)
  }, [handleWheel])

  // Re-render on data or transform change
  useEffect(() => {
    render()
  }, [render])

  // Fit to view only when mapVersion changes (new map generated)
  useEffect(() => {
    if (mapData && containerRef.current && mapVersion > 0) {
      const rect = containerRef.current.getBoundingClientRect()
      fitToView(
        mapData.width * CELL_SIZE,
        mapData.height * CELL_SIZE,
        rect.width,
        rect.height
      )
    }
  }, [mapVersion, fitToView]) // mapData 제거, mapVersion만 의존

  // Get hovered room for tooltip
  const hoveredRoom = mapData?.rooms.find(r => r.id === hoveredRoomId) || null
  const hoveredZone = hoveredRoom ? mapData?.zones[hoveredRoom.zone_id] || null : null

  // Determine cursor
  let cursor = 'crosshair'
  if (isDragging) cursor = 'grabbing'
  else if (isDrawing) cursor = 'crosshair'
  else if (currentTool === 'draw') cursor = 'crosshair'
  else if (connectingFromId !== null) cursor = 'pointer'
  else if (hoveredRoomId === selectedRoomId && selectedRoomId !== null) cursor = 'grab'

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor,
        backgroundColor: '#0d0d12'
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      
      <Tooltip
        room={hoveredRoom}
        zone={hoveredZone}
        position={tooltipPos}
        visible={hoveredRoomId !== null && !isDragging}
        t={t}
      />

      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 10,
        fontSize: 11,
        color: '#555',
        pointerEvents: 'none'
      }}>
        {t.instructions}
      </div>
    </div>
  )
}
