import React, { useRef, useEffect, useCallback, useState } from 'react'
import { MapData, Room, Connection, GATE_COLORS, Point, EditorTool, GateCondition } from '../types/map'
import { useCanvasTransform } from '../hooks/useCanvasTransform'
import { Tooltip } from './Tooltip'
import { Translations } from '../i18n/translations'
import { getContrastColor } from '../lib/colorUtils'
import { drawSvgIcon } from '../lib/iconRenderer'

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
  interactive?: boolean
  onSelectRoom: (id: number | null) => void
  onToggleRoomSelection: (id: number) => void  // Ctrl+클릭 다중 선택
  onSetSelectedRooms: (ids: number[]) => void  // 선택 일괄 설정
  onHoverRoom: (id: number | null) => void
  onUpdateRoom?: (id: number, updates: Partial<Room>, recordHistory?: boolean) => void
  onUpdateRoomPositions?: (updates: Array<{ id: number; x: number; y: number }>, recordHistory?: boolean) => void
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
  interactive = true,
  onSelectRoom,
  onToggleRoomSelection,
  onSetSelectedRooms,
  onHoverRoom,
  onUpdateRoom,
  onUpdateRoomPositions,
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
  const [showDetails, setShowDetails] = useState(true)
  const [imageTick, setImageTick] = useState(0)

  // Box selection state (drag-to-select)
  const [isBoxSelecting, setIsBoxSelecting] = useState(false)
  const [boxStartCell, setBoxStartCell] = useState<Point | null>(null)
  const [boxCurrentCell, setBoxCurrentCell] = useState<Point | null>(null)
  const boxAdditiveRef = useRef(false)
  const didBoxSelectRef = useRef(false)

  // Drag state (moving room)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null)
  const [dragRoomOriginalPos, setDragRoomOriginalPos] = useState<{ x: number; y: number } | null>(null) // legacy: 단일
  const [dragOriginalPositions, setDragOriginalPositions] = useState<Array<{ id: number; x: number; y: number }> | null>(null) // 다중/단일 공용

  // Connection creation state
  const [connectingFromId, setConnectingFromId] = useState<number | null>(null)

  // Draw mode state (creating room by dragging)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStartCell, setDrawStartCell] = useState<Point | null>(null)
  const [drawCurrentCell, setDrawCurrentCell] = useState<Point | null>(null)

  // Spacebar panning state
  const [isSpaceDown, setIsSpaceDown] = useState(false)

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
          if (showDetails && room.detail && room.detail.layers) {
            ctx.save()
            // Transform to local room top-left instead of rect top-left
            ctx.translate(room.x * CELL_SIZE, room.y * CELL_SIZE)

            ctx.fillStyle = baseColor
            ctx.globalAlpha = isHovered || isDragging && (isSelected || isMultiSelected) ? 0.9 : 0.7
            ctx.fillRect(rx * CELL_SIZE, ry * CELL_SIZE, w, h)

            ctx.beginPath()
            ctx.rect(rx * CELL_SIZE, ry * CELL_SIZE, w, h)
            ctx.clip()

            ctx.globalAlpha = 1
            const scaleX = (room.w * CELL_SIZE) / room.detail.tileWidth
            const scaleY = (room.h * CELL_SIZE) / room.detail.tileHeight

            for (const layer of room.detail.layers) {
              if (layer.visible && layer.type === 'tile' && layer.tiles) {
                for (let ty = 0; ty < room.detail.tileHeight; ty++) {
                  const row = layer.tiles[ty]
                  if (!row) continue
                  for (let tx = 0; tx < room.detail.tileWidth; tx++) {
                    const t = row[tx] || 'empty'
                    if (t !== 'empty') {
                      ctx.fillStyle = t === 'solid' ? 'rgba(255,255,255,0.7)' : (t === 'platform' ? 'rgba(0,255,136,0.6)' : 'rgba(255,0,0,0.6)')
                      ctx.fillRect(tx * scaleX, ty * scaleY, scaleX + 0.5, scaleY + 0.5)
                    }
                  }
                }
              }
            }
            ctx.restore()
          } else {
            ctx.fillStyle = baseColor
            ctx.globalAlpha = isHovered || isDragging && (isSelected || isMultiSelected) ? 0.9 : 0.7
            ctx.fillRect(absX, absY, w, h)
            ctx.globalAlpha = 1
          }

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

        if (showDetails && room.detail && room.detail.layers) {
          ctx.save()
          ctx.translate(rx, ry)
          ctx.fillStyle = baseColor
          ctx.globalAlpha = isHovered || isDragging && (isSelected || isMultiSelected) ? 0.9 : 0.7
          ctx.fillRect(0, 0, rw, rh)

          ctx.globalAlpha = 1
          const scaleX = rw / room.detail.tileWidth
          const scaleY = rh / room.detail.tileHeight

          for (const layer of room.detail.layers) {
            if (layer.visible && layer.type === 'tile' && layer.tiles) {
              for (let ty = 0; ty < room.detail.tileHeight; ty++) {
                const row = layer.tiles[ty]
                if (!row) continue
                for (let tx = 0; tx < room.detail.tileWidth; tx++) {
                  const t = row[tx] || 'empty'
                  if (t !== 'empty') {
                    ctx.fillStyle = t === 'solid' ? 'rgba(255,255,255,0.7)' : (t === 'platform' ? 'rgba(0,255,136,0.6)' : 'rgba(255,0,0,0.6)')
                    ctx.fillRect(tx * scaleX, ty * scaleY, scaleX + 0.5, scaleY + 0.5)
                  }
                }
              }
            }
          }
          ctx.restore()
        } else {
          ctx.fillStyle = baseColor
          ctx.globalAlpha = isHovered || isDragging && (isSelected || isMultiSelected) ? 0.9 : 0.7
          ctx.fillRect(rx, ry, rw, rh)
          ctx.globalAlpha = 1
        }

        ctx.strokeStyle = isSelected ? '#ffff00' :
          isMultiSelected ? '#00ffff' :
            isConnectingFrom ? '#00ff00' :
              isHovered ? '#ffffff' : '#888'
        ctx.lineWidth = (isSelected || isMultiSelected || isHovered || isConnectingFrom ? 3 : 1.5) / transform.scale
        ctx.strokeRect(rx, ry, rw, rh)
      }

      // Draw room type icon/label
      const contrastColor = getContrastColor(baseColor)

      if (room.type !== 'normal') {
        const cx = (room.x + room.w / 2) * CELL_SIZE
        const cy = (room.y + room.h / 2) * CELL_SIZE
        drawSvgIcon(ctx, room.type, cx, cy, 24 / transform.scale, contrastColor, () => setImageTick(prev => prev + 1))
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

    // Draw box selection preview (select tool drag)
    if (isBoxSelecting && boxStartCell && boxCurrentCell) {
      const minX = Math.min(boxStartCell.x, boxCurrentCell.x)
      const minY = Math.min(boxStartCell.y, boxCurrentCell.y)
      const maxX = Math.max(boxStartCell.x, boxCurrentCell.x)
      const maxY = Math.max(boxStartCell.y, boxCurrentCell.y)

      const previewX = minX * CELL_SIZE
      const previewY = minY * CELL_SIZE
      const previewW = (maxX - minX + 1) * CELL_SIZE
      const previewH = (maxY - minY + 1) * CELL_SIZE

      ctx.fillStyle = 'rgba(0, 255, 255, 0.10)'
      ctx.fillRect(previewX, previewY, previewW, previewH)

      ctx.strokeStyle = '#00ffff'
      ctx.lineWidth = 2 / transform.scale
      ctx.setLineDash([6 / transform.scale, 3 / transform.scale])
      ctx.strokeRect(previewX, previewY, previewW, previewH)
      ctx.setLineDash([])
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

  }, [mapData, connections, selectedRoomId, selectedRoomIds, hoveredRoomId, selectedConnection, transform, isDragging, connectingFromId, mousePos, screenToWorld, isDrawing, drawStartCell, drawCurrentCell, isBoxSelecting, boxStartCell, boxCurrentCell, t])

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })
    setTooltipPos({ x: e.clientX, y: e.clientY })

    // Handle box selection (drag-to-select)
    if (isBoxSelecting && boxStartCell) {
      const worldPos = screenToWorld(x, y)
      const cellX = Math.floor(worldPos.x / CELL_SIZE)
      const cellY = Math.floor(worldPos.y / CELL_SIZE)
      setBoxCurrentCell({ x: cellX, y: cellY })
      return
    }

    // Handle drawing room
    if (isDrawing && drawStartCell) {
      const worldPos = screenToWorld(x, y)
      const cellX = Math.floor(worldPos.x / CELL_SIZE)
      const cellY = Math.floor(worldPos.y / CELL_SIZE)
      setDrawCurrentCell({ x: cellX, y: cellY })
      return
    }

    // Handle dragging room (single or multi)
    if (isDragging && dragStartPos && dragOriginalPositions && (onUpdateRoomPositions || onUpdateRoom)) {
      const currentWorld = screenToWorld(x, y)
      const startWorld = screenToWorld(dragStartPos.x, dragStartPos.y)

      const dx = Math.round((currentWorld.x - startWorld.x) / CELL_SIZE)
      const dy = Math.round((currentWorld.y - startWorld.y) / CELL_SIZE)

      const updates = dragOriginalPositions.map((p) => ({ id: p.id, x: p.x + dx, y: p.y + dy }))

      // Prefer bulk update to keep history checkpoint correct
      if (onUpdateRoomPositions) {
        onUpdateRoomPositions(updates, false)
      } else if (onUpdateRoom && updates.length === 1) {
        onUpdateRoom(updates[0].id, { x: updates[0].x, y: updates[0].y }, false)
      }
    }

    // Handle panning
    updatePan(e)

    // Update hovered room (not while dragging/drawing)
    if (!isDragging && !isDrawing && !isBoxSelecting) {
      const room = getRoomAtPosition(x, y)
      onHoverRoom(room?.id || null)
    }
  }, [interactive, isBoxSelecting, boxStartCell, isDragging, isDrawing, drawStartCell, dragStartPos, dragRoomOriginalPos, dragOriginalPositions, onUpdateRoomPositions, onUpdateRoom, updatePan, getRoomAtPosition, onHoverRoom, screenToWorld])

  // Handle click
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!interactive) return
    // 박스 선택 드래그 후 발생하는 click 이벤트 무시
    if (didBoxSelectRef.current) {
      didBoxSelectRef.current = false
      return
    }
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
  }, [interactive, isDragging, getRoomAtPosition, getConnectionAtPosition, currentTool, connectingFromId, onAddConnection, onSelectRoom, onToggleRoomSelection, onSetSelectedRooms, onSelectConnection])

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Middle mouse, Shift+Left, or Space+Left for panning
    if (e.button === 1 || (e.button === 0 && (e.shiftKey || isSpaceDown))) {
      e.preventDefault()
      startPan(e)
      return
    }

    // Select tool - start box selection on empty space
    if (e.button === 0 && currentTool === 'select') {
      const room = getRoomAtPosition(x, y)
      if (!room) {
        const worldPos = screenToWorld(x, y)
        const cellX = Math.floor(worldPos.x / CELL_SIZE)
        const cellY = Math.floor(worldPos.y / CELL_SIZE)
        setIsBoxSelecting(true)
        setBoxStartCell({ x: cellX, y: cellY })
        setBoxCurrentCell({ x: cellX, y: cellY })
        boxAdditiveRef.current = !!(e.ctrlKey || e.metaKey)
        return
      }
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

    // Left click on selected room(s) starts drag
    if (e.button === 0 && !e.ctrlKey && currentTool === 'select') {
      const room = getRoomAtPosition(x, y)
      if (room) {
        const isInMulti = selectedRoomIds.includes(room.id)
        const isSingleSelected = room.id === selectedRoomId
        const shouldDrag = isInMulti || isSingleSelected

        if (shouldDrag) {
          setIsDragging(true)
          setDragStartPos({ x, y })
          setDragRoomOriginalPos({ x: room.x, y: room.y })

          const ids = isInMulti ? selectedRoomIds : [room.id]
          const originals = (mapData?.rooms ?? [])
            .filter((r) => ids.includes(r.id))
            .map((r) => ({ id: r.id, x: r.x, y: r.y }))
          setDragOriginalPositions(originals)

          // 단일 선택만 있는 상태면 기존 UX 유지(선택 확정)
          if (!isInMulti && selectedRoomId !== room.id) onSelectRoom(room.id)
        }
      }
    }
  }, [interactive, startPan, getRoomAtPosition, selectedRoomId, selectedRoomIds, currentTool, screenToWorld, mapData, onSelectRoom])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!interactive) return
    // Finish box selection
    if (isBoxSelecting && boxStartCell && boxCurrentCell && mapData) {
      const sameCell = boxStartCell.x === boxCurrentCell.x && boxStartCell.y === boxCurrentCell.y

      if (!sameCell) {
        const minX = Math.min(boxStartCell.x, boxCurrentCell.x)
        const minY = Math.min(boxStartCell.y, boxCurrentCell.y)
        const maxX = Math.max(boxStartCell.x, boxCurrentCell.x)
        const maxY = Math.max(boxStartCell.y, boxCurrentCell.y)

        const selectedIds: number[] = []

        for (const room of mapData.rooms) {
          const rects = room.rects?.length ? room.rects : [[0, 0, room.w, room.h]]
          const intersects = rects.some(([rx, ry, rw, rh]) => {
            const rMinX = room.x + rx
            const rMinY = room.y + ry
            const rMaxX = rMinX + rw - 1
            const rMaxY = rMinY + rh - 1
            return !(rMaxX < minX || rMinX > maxX || rMaxY < minY || rMinY > maxY)
          })
          if (intersects) selectedIds.push(room.id)
        }

        const nextIds = boxAdditiveRef.current
          ? Array.from(new Set([...selectedRoomIds, ...selectedIds]))
          : selectedIds

        onSelectRoom(null)
        onSetSelectedRooms(nextIds)
        if (onSelectConnection) onSelectConnection(null)
        didBoxSelectRef.current = true
      }

      setIsBoxSelecting(false)
      setBoxStartCell(null)
      setBoxCurrentCell(null)
      boxAdditiveRef.current = false
      return
    }

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

    // Finish dragging room(s) - record history
    if (isDragging && dragOriginalPositions && mapData && (onUpdateRoomPositions || onUpdateRoom)) {
      const finalUpdates = dragOriginalPositions
        .map((p) => {
          const r = mapData.rooms.find((rr) => rr.id === p.id)
          return r ? { id: r.id, x: r.x, y: r.y } : null
        })
        .filter(Boolean) as Array<{ id: number; x: number; y: number }>

      if (onUpdateRoomPositions) {
        onUpdateRoomPositions(finalUpdates, true)
      } else if (onUpdateRoom && finalUpdates.length === 1) {
        onUpdateRoom(finalUpdates[0].id, { x: finalUpdates[0].x, y: finalUpdates[0].y }, true)
      }

      setIsDragging(false)
      setDragStartPos(null)
      setDragRoomOriginalPos(null)
      setDragOriginalPositions(null)
    }

    endPan()
  }, [interactive, isBoxSelecting, boxStartCell, boxCurrentCell, mapData, selectedRoomIds, onSelectRoom, onSetSelectedRooms, onSelectConnection, isDrawing, isDragging, drawStartCell, drawCurrentCell, selectedRoomId, onAddRoom, onUpdateRoom, onUpdateRoomPositions, dragOriginalPositions, endPan, isSpaceDown, startPan, screenToWorld, getRoomAtPosition, currentTool])

  // IMPORTANT: 캔버스 밖에서 mouseup이 발생하면 onMouseUp이 호출되지 않아
  // 드래그/그리기/박스선택이 "종료 커밋"되지 않고 Undo 히스토리가 쌓이지 않는 문제가 생긴다.
  // window 레벨에서 mouseup을 받아 종료 처리를 보장한다.
  useEffect(() => {
    const onWindowMouseUp = () => {
      if (isDragging || isDrawing || isBoxSelecting || isPanning) {
        handleMouseUp()
      }
    }
    window.addEventListener('mouseup', onWindowMouseUp)
    return () => window.removeEventListener('mouseup', onWindowMouseUp)
  }, [isDragging, isDrawing, isBoxSelecting, isPanning, handleMouseUp])

  // Track spacebar for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setIsSpaceDown(true)
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (!interactive) return
    // IMPORTANT: leaving the canvas while dragging/drawing/box-selecting can otherwise
    // drop the "commit" step (and break Undo). Treat mouse-leave like mouse-up.
    if (isBoxSelecting || isDrawing || isDragging) {
      handleMouseUp()
      onHoverRoom(null)
      return
    }
    endPan()
    onHoverRoom(null)
  }, [interactive, isBoxSelecting, isDrawing, isDragging, handleMouseUp, endPan, onHoverRoom])

  // Handle double click (add new room)
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!interactive) return
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
  }, [interactive, onAddRoom, onDoubleClickRoom, mapData, getRoomAtPosition, screenToWorld, onSelectRoom])

  // Handle key press (ESC to cancel, Delete to remove)
  useEffect(() => {
    if (!interactive) return
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
  }, [interactive, selectedRoomId, selectedConnection, onDeleteRoom, onDeleteConnection, onSelectRoom, onSelectConnection])

  // Attach wheel event listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const wheelHandler = (e: WheelEvent) => {
      if (!interactive) return
      e.preventDefault()
      handleWheel(e)
    }

    container.addEventListener('wheel', wheelHandler, { passive: false })
    return () => container.removeEventListener('wheel', wheelHandler)
  }, [interactive, handleWheel])

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

  // Listen for export image event
  useEffect(() => {
    const handleExportImage = () => {
      if (!mapData || !mapData.rooms.length) return

      const { rooms } = mapData
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

      rooms.forEach(room => {
        if (room.rects && room.rects.length > 0) {
          room.rects.forEach(([rx, ry, rw, rh]) => {
            const absX = room.x + rx
            const absY = room.y + ry
            if (absX < minX) minX = absX
            if (absY < minY) minY = absY
            if (absX + rw > maxX) maxX = absX + rw
            if (absY + rh > maxY) maxY = absY + rh
          })
        } else {
          if (room.x < minX) minX = room.x
          if (room.y < minY) minY = room.y
          if (room.x + room.w > maxX) maxX = room.x + room.w
          if (room.y + room.h > maxY) maxY = room.y + room.h
        }
      })

      const padding = 2
      minX -= padding
      minY -= padding
      maxX += padding
      maxY += padding

      const width = (maxX - minX) * CELL_SIZE
      const height = (maxY - minY) * CELL_SIZE

      const offCanvas = document.createElement('canvas')
      offCanvas.width = width
      offCanvas.height = height
      const ctx = offCanvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#0d0d12'
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      ctx.translate(-minX * CELL_SIZE, -minY * CELL_SIZE)

      // Draw grid
      ctx.strokeStyle = '#1a1a24'
      ctx.lineWidth = 1
      for (let x = minX * CELL_SIZE; x < maxX * CELL_SIZE; x += CELL_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, minY * CELL_SIZE); ctx.lineTo(x, maxY * CELL_SIZE); ctx.stroke();
      }
      for (let y = minY * CELL_SIZE; y < maxY * CELL_SIZE; y += CELL_SIZE) {
        ctx.beginPath(); ctx.moveTo(minX * CELL_SIZE, y); ctx.lineTo(maxX * CELL_SIZE, y); ctx.stroke();
      }

      // Draw connections
      connections.forEach(conn => {
        const fromRoom = rooms.find(r => r.id === conn.fromId)
        const toRoom = rooms.find(r => r.id === conn.toId)
        if (!fromRoom || !toRoom) return

        const fromCenterX = (fromRoom.x + fromRoom.w / 2) * CELL_SIZE
        const fromCenterY = (fromRoom.y + fromRoom.h / 2) * CELL_SIZE
        const toCenterX = (toRoom.x + toRoom.w / 2) * CELL_SIZE
        const toCenterY = (toRoom.y + toRoom.h / 2) * CELL_SIZE

        ctx.beginPath()
        ctx.strokeStyle = GATE_COLORS[conn.condition] || '#444'
        ctx.lineWidth = conn.condition === 'none' ? 2 : 3
        if (conn.condition !== 'none') {
          ctx.setLineDash([8, 4])
        } else {
          ctx.setLineDash([])
        }

        ctx.moveTo(fromCenterX, fromCenterY)
        ctx.lineTo(toCenterX, toCenterY)
        ctx.stroke()
        ctx.setLineDash([])
      })

      // Draw rooms
      rooms.forEach(room => {
        const zone = mapData.zones[room.zone_id]
        const baseColor = zone?.color || '#555'

        if (room.rects && room.rects.length > 0) {
          room.rects.forEach(([rx, ry, rw, rh]) => {
            const absX = (room.x + rx) * CELL_SIZE
            const absY = (room.y + ry) * CELL_SIZE
            const w = rw * CELL_SIZE
            const h = rh * CELL_SIZE

            if (showDetails && room.detail && room.detail.layers) {
              ctx.save()
              ctx.translate(room.x * CELL_SIZE, room.y * CELL_SIZE)
              ctx.fillStyle = baseColor
              ctx.globalAlpha = 0.8
              ctx.fillRect(rx * CELL_SIZE, ry * CELL_SIZE, w, h)
              ctx.beginPath()
              ctx.rect(rx * CELL_SIZE, ry * CELL_SIZE, w, h)
              ctx.clip()

              ctx.globalAlpha = 1
              const scaleX = (room.w * CELL_SIZE) / room.detail.tileWidth
              const scaleY = (room.h * CELL_SIZE) / room.detail.tileHeight

              for (const layer of room.detail.layers) {
                if (layer.visible && layer.type === 'tile' && layer.tiles) {
                  for (let ty = 0; ty < room.detail.tileHeight; ty++) {
                    const row = layer.tiles[ty]
                    if (!row) continue
                    for (let tx = 0; tx < room.detail.tileWidth; tx++) {
                      const t = row[tx] || 'empty'
                      if (t !== 'empty') {
                        ctx.fillStyle = t === 'solid' ? 'rgba(255,255,255,0.7)' : (t === 'platform' ? 'rgba(0,255,136,0.6)' : 'rgba(255,0,0,0.6)')
                        ctx.fillRect(tx * scaleX, ty * scaleY, scaleX + 0.5, scaleY + 0.5)
                      }
                    }
                  }
                }
              }
              ctx.restore()
            } else {
              ctx.fillStyle = baseColor
              ctx.globalAlpha = 0.8
              ctx.fillRect(absX, absY, w, h)
              ctx.globalAlpha = 1
            }

            ctx.strokeStyle = '#888'
            ctx.lineWidth = 2
            ctx.strokeRect(absX, absY, w, h)
          })
        } else {
          const rx = room.x * CELL_SIZE
          const ry = room.y * CELL_SIZE
          const rw = room.w * CELL_SIZE
          const rh = room.h * CELL_SIZE

          if (showDetails && room.detail && room.detail.layers) {
            ctx.save()
            ctx.translate(rx, ry)
            ctx.fillStyle = baseColor
            ctx.globalAlpha = 0.8
            ctx.fillRect(0, 0, rw, rh)

            ctx.globalAlpha = 1
            const scaleX = rw / room.detail.tileWidth
            const scaleY = rh / room.detail.tileHeight

            for (const layer of room.detail.layers) {
              if (layer.visible && layer.type === 'tile' && layer.tiles) {
                for (let ty = 0; ty < room.detail.tileHeight; ty++) {
                  const row = layer.tiles[ty]
                  if (!row) continue
                  for (let tx = 0; tx < room.detail.tileWidth; tx++) {
                    const t = row[tx] || 'empty'
                    if (t !== 'empty') {
                      ctx.fillStyle = t === 'solid' ? 'rgba(255,255,255,0.7)' : (t === 'platform' ? 'rgba(0,255,136,0.6)' : 'rgba(255,0,0,0.6)')
                      ctx.fillRect(tx * scaleX, ty * scaleY, scaleX + 0.5, scaleY + 0.5)
                    }
                  }
                }
              }
            }
            ctx.restore()
          } else {
            ctx.fillStyle = baseColor
            ctx.globalAlpha = 0.8
            ctx.fillRect(rx, ry, rw, rh)
            ctx.globalAlpha = 1
          }

          ctx.strokeStyle = '#888'
          ctx.lineWidth = 2
          ctx.strokeRect(rx, ry, rw, rh)
        }

        const contrastColor = getContrastColor(baseColor)

        if (room.type !== 'normal') {
          const cx = (room.x + room.w / 2) * CELL_SIZE
          const cy = (room.y + room.h / 2) * CELL_SIZE

          // Note: In screenshot export, we depend on the cache being populated from normal rendering.
          // Since screenshots are taken manually by the user, the icons should already be cached.
          // We pass a dummy onload here just in case, but it won't re-trigger screenshot.
          drawSvgIcon(ctx, room.type, cx, cy, 24, contrastColor)
        }
      })

      ctx.restore()

      // Download
      const url = offCanvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `mapmate-screenshot-${Date.now()}.png`
      a.click()
    }

    window.addEventListener('export-map-image', handleExportImage)
    return () => window.removeEventListener('export-map-image', handleExportImage)
  }, [mapData, connections, showDetails])

  // Get hovered room for tooltip
  const hoveredRoom = mapData?.rooms.find(r => r.id === hoveredRoomId) || null
  const hoveredZone = hoveredRoom ? mapData?.zones[hoveredRoom.zone_id] || null : null

  // Determine cursor
  let cursor = interactive ? 'crosshair' : 'not-allowed'
  if (interactive) {
    if (isSpaceDown) cursor = isPanning ? 'grabbing' : 'grab'
    else if (isDragging) cursor = 'grabbing'
    else if (isDrawing) cursor = 'crosshair'
    else if (currentTool === 'draw') cursor = 'crosshair'
    else if (connectingFromId !== null) cursor = 'pointer'
    else if (hoveredRoomId !== null && (hoveredRoomId === selectedRoomId || selectedRoomIds.includes(hoveredRoomId))) cursor = 'grab'
  }

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
        visible={hoveredRoomId !== null && !isDragging && !isBoxSelecting}
        t={t}
      />

      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        gap: 8,
        zIndex: 10
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowDetails(v => !v) }}
          className={`btn-base ${showDetails ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 12px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}
        >
          {showDetails ? '상세맵 썸네일 숨기기' : '상세맵 썸네일 보이기'}
        </button>
      </div>

      {/* Instructions overlay */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'right',
        pointerEvents: 'none',
        zIndex: 50
      }}>
        {t.instructions}
      </div>
    </div>
  )
}
