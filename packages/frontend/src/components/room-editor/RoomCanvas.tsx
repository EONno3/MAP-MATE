import React, { useRef, useEffect, useCallback, useState } from 'react'
import { 
  RoomDetail, TileType, ObjectType, RoomObject,
  TILE_COLORS, OBJECT_ICONS, TILE_SIZE
} from '../../types/map'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'
import { Translations } from '../../i18n/translations'

export type RoomToolMode = 'brush' | 'fill'

interface RoomCanvasProps {
  roomDetail: RoomDetail
  selectedTile: TileType
  selectedObject: ObjectType | null
  brushSize: number
  toolMode: RoomToolMode
  onUpdateTiles: (tiles: TileType[][], recordHistory?: boolean) => void
  onUpdateObjects: (objects: RoomObject[], recordHistory?: boolean) => void
  t: Translations
}

export function RoomCanvas({
  roomDetail,
  selectedTile,
  selectedObject,
  brushSize,
  toolMode,
  onUpdateTiles,
  onUpdateObjects,
  t
}: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPainting, setIsPainting] = useState(false)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [selectedObjectInstance, setSelectedObjectInstance] = useState<string | null>(null)
  
  // Painting state - useRef를 사용하여 최신 값을 항상 참조
  const paintingTilesRef = useRef<TileType[][] | null>(null)
  const [isDraggingObject, setIsDraggingObject] = useState(false)
  const [draggedObjectOrigPos, setDraggedObjectOrigPos] = useState<{ x: number; y: number } | null>(null)
  
  // Fill tool state - 드래그로 직사각형 영역 채우기 (ref로 관리하여 클로저 문제 방지)
  const [isFilling, setIsFilling] = useState(false)
  const fillStartRef = useRef<{ x: number; y: number } | null>(null)
  const fillEndRef = useRef<{ x: number; y: number } | null>(null)
  const fillPreviewTilesRef = useRef<TileType[][] | null>(null)
  // 렌더링용 상태 (프리뷰 박스 표시)
  const [fillPreviewBounds, setFillPreviewBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null)

  const {
    transform,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    screenToWorld,
    fitToView
  } = useCanvasTransform()

  // Get tile at screen position
  const getTileAtPosition = useCallback((screenX: number, screenY: number): { x: number; y: number } | null => {
    const worldPos = screenToWorld(screenX, screenY)
    const tileX = Math.floor(worldPos.x / TILE_SIZE)
    const tileY = Math.floor(worldPos.y / TILE_SIZE)

    if (tileX >= 0 && tileX < roomDetail.tileWidth && 
        tileY >= 0 && tileY < roomDetail.tileHeight) {
      return { x: tileX, y: tileY }
    }
    return null
  }, [roomDetail, screenToWorld])

  // Get object at screen position
  const getObjectAtPosition = useCallback((screenX: number, screenY: number): RoomObject | null => {
    const worldPos = screenToWorld(screenX, screenY)
    const tileX = Math.floor(worldPos.x / TILE_SIZE)
    const tileY = Math.floor(worldPos.y / TILE_SIZE)

    return roomDetail.objects.find(obj => obj.x === tileX && obj.y === tileY) || null
  }, [roomDetail, screenToWorld])

  // Start painting - 시작 시 현재 타일 상태를 복사
  const startPainting = useCallback(() => {
    paintingTilesRef.current = roomDetail.tiles.map(row => [...row])
  }, [roomDetail.tiles])

  // Paint tile at position with brush size - 페인팅 중에는 임시 타일에만 적용
  const paintTile = useCallback((x: number, y: number) => {
    if (selectedObject) return // Don't paint tiles when object mode is active
    if (!paintingTilesRef.current) return
    
    const halfBrush = Math.floor(brushSize / 2)
    let changed = false
    
    for (let dy = -halfBrush; dy <= halfBrush; dy++) {
      for (let dx = -halfBrush; dx <= halfBrush; dx++) {
        const tx = x + dx
        const ty = y + dy
        
        if (tx >= 0 && tx < roomDetail.tileWidth && ty >= 0 && ty < roomDetail.tileHeight) {
          if (paintingTilesRef.current[ty][tx] !== selectedTile) {
            paintingTilesRef.current[ty][tx] = selectedTile
            changed = true
          }
        }
      }
    }
    
    if (changed) {
      // 화면에 즉시 반영 (히스토리 기록 안함)
      const newTiles = paintingTilesRef.current.map(row => [...row])
      onUpdateTiles(newTiles, false)
    }
  }, [roomDetail.tileWidth, roomDetail.tileHeight, selectedTile, selectedObject, brushSize, onUpdateTiles])

  // End painting - 완료 시 히스토리에 기록
  const endPainting = useCallback(() => {
    if (paintingTilesRef.current) {
      // 최종 결과를 히스토리에 기록
      const finalTiles = paintingTilesRef.current.map(row => [...row])
      onUpdateTiles(finalTiles, true)
      paintingTilesRef.current = null
    }
  }, [onUpdateTiles])

  // Fill rectangle area - 드래그로 직사각형 영역 채우기
  const startFill = useCallback((x: number, y: number) => {
    fillPreviewTilesRef.current = roomDetail.tiles.map(row => [...row])
    fillStartRef.current = { x, y }
    fillEndRef.current = { x, y }
    setFillPreviewBounds({ minX: x, maxX: x, minY: y, maxY: y })
  }, [roomDetail.tiles])

  const updateFillPreview = useCallback((x: number, y: number) => {
    const fillStart = fillStartRef.current
    if (!fillStart || !fillPreviewTilesRef.current) return
    
    fillEndRef.current = { x, y }
    
    // Calculate rectangle bounds
    const minX = Math.max(0, Math.min(fillStart.x, x))
    const maxX = Math.min(roomDetail.tileWidth - 1, Math.max(fillStart.x, x))
    const minY = Math.max(0, Math.min(fillStart.y, y))
    const maxY = Math.min(roomDetail.tileHeight - 1, Math.max(fillStart.y, y))
    
    setFillPreviewBounds({ minX, maxX, minY, maxY })
    
    // Reset to original tiles and apply fill preview
    const previewTiles = roomDetail.tiles.map(row => [...row])
    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        previewTiles[ty][tx] = selectedTile
      }
    }
    
    fillPreviewTilesRef.current = previewTiles
    onUpdateTiles(previewTiles, false)
  }, [roomDetail, selectedTile, onUpdateTiles])

  const endFill = useCallback(() => {
    // ref 값을 사용하여 클로저 문제 방지
    if (fillPreviewTilesRef.current) {
      // 최종 결과를 히스토리에 기록
      const finalTiles = fillPreviewTilesRef.current.map(row => [...row])
      onUpdateTiles(finalTiles, true)
    }
    fillPreviewTilesRef.current = null
    fillStartRef.current = null
    fillEndRef.current = null
    setFillPreviewBounds(null)
  }, [onUpdateTiles])

  // Place or remove object
  const handleObjectAction = useCallback((x: number, y: number) => {
    if (!selectedObject) {
      // If no object selected, try to select existing object for dragging
      const obj = roomDetail.objects.find(o => o.x === x && o.y === y)
      if (obj) {
        if (selectedObjectInstance === obj.id) {
          // Already selected, start dragging
          setIsDraggingObject(true)
          setDraggedObjectOrigPos({ x: obj.x, y: obj.y })
        } else {
          // Select the object
          setSelectedObjectInstance(obj.id)
        }
      } else {
        // Click on empty space, deselect
        setSelectedObjectInstance(null)
      }
      return
    }

    // Check if there's already an object at this position
    const existingIndex = roomDetail.objects.findIndex(o => o.x === x && o.y === y)
    
    if (existingIndex >= 0) {
      // Remove existing object
      const newObjects = roomDetail.objects.filter((_, i) => i !== existingIndex)
      onUpdateObjects(newObjects, true)
    } else {
      // Add new object
      const newObject: RoomObject = {
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedObject,
        x,
        y
      }
      onUpdateObjects([...roomDetail.objects, newObject], true)
    }
  }, [selectedObject, roomDetail.objects, selectedObjectInstance, onUpdateObjects])

  // Move selected object
  const moveSelectedObject = useCallback((x: number, y: number) => {
    if (!selectedObjectInstance || !isDraggingObject) return
    
    const newObjects = roomDetail.objects.map(obj =>
      obj.id === selectedObjectInstance ? { ...obj, x, y } : obj
    )
    onUpdateObjects(newObjects, false) // 드래그 중에는 히스토리 기록 안함
  }, [selectedObjectInstance, isDraggingObject, roomDetail.objects, onUpdateObjects])

  // End object drag
  const endObjectDrag = useCallback(() => {
    if (isDraggingObject && selectedObjectInstance && draggedObjectOrigPos) {
      const obj = roomDetail.objects.find(o => o.id === selectedObjectInstance)
      if (obj && (obj.x !== draggedObjectOrigPos.x || obj.y !== draggedObjectOrigPos.y)) {
        // 위치가 변경되었으면 히스토리에 기록
        onUpdateObjects(roomDetail.objects, true)
      }
    }
    setIsDraggingObject(false)
    setDraggedObjectOrigPos(null)
  }, [isDraggingObject, selectedObjectInstance, draggedObjectOrigPos, roomDetail.objects, onUpdateObjects])

  // Delete selected object
  const deleteSelectedObject = useCallback(() => {
    if (selectedObjectInstance) {
      const newObjects = roomDetail.objects.filter(o => o.id !== selectedObjectInstance)
      onUpdateObjects(newObjects)
      setSelectedObjectInstance(null)
    }
  }, [selectedObjectInstance, roomDetail.objects, onUpdateObjects])

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Clear
    ctx.fillStyle = '#1a1a24'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply transform
    ctx.save()
    ctx.translate(transform.offsetX, transform.offsetY)
    ctx.scale(transform.scale, transform.scale)

    const { tileWidth, tileHeight, tiles, objects } = roomDetail

    // Draw grid background
    ctx.fillStyle = '#0d0d12'
    ctx.fillRect(0, 0, tileWidth * TILE_SIZE, tileHeight * TILE_SIZE)

    // Draw tiles
    for (let y = 0; y < tileHeight; y++) {
      for (let x = 0; x < tileWidth; x++) {
        const tile = tiles[y]?.[x] || 'empty'
        const px = x * TILE_SIZE
        const py = y * TILE_SIZE

        if (tile !== 'empty') {
          ctx.fillStyle = TILE_COLORS[tile]
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE)
        }

        // Draw grid lines
        ctx.strokeStyle = '#2a2a34'
        ctx.lineWidth = 0.5 / transform.scale
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE)
      }
    }

    // Draw fill preview rectangle
    if (isFilling && fillPreviewBounds) {
      const { minX, maxX, minY, maxY } = fillPreviewBounds
      
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2 / transform.scale
      ctx.setLineDash([4 / transform.scale, 4 / transform.scale])
      ctx.strokeRect(
        minX * TILE_SIZE,
        minY * TILE_SIZE,
        (maxX - minX + 1) * TILE_SIZE,
        (maxY - minY + 1) * TILE_SIZE
      )
      ctx.setLineDash([])
    }

    // Draw hovered tile highlight with brush size
    if (hoveredTile) {
      const halfBrush = Math.floor(brushSize / 2)
      
      if (selectedObject) {
        // Object mode - single tile highlight
        ctx.fillStyle = 'rgba(33, 150, 243, 0.3)'
        ctx.fillRect(
          hoveredTile.x * TILE_SIZE,
          hoveredTile.y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        )
        ctx.strokeStyle = '#2196F3'
        ctx.lineWidth = 2 / transform.scale
        ctx.strokeRect(
          hoveredTile.x * TILE_SIZE,
          hoveredTile.y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        )
      } else if (toolMode === 'fill' && !isFilling) {
        // Fill mode - show crosshair
        ctx.strokeStyle = '#00ff88'
        ctx.lineWidth = 1 / transform.scale
        ctx.setLineDash([2 / transform.scale, 2 / transform.scale])
        ctx.beginPath()
        ctx.moveTo(hoveredTile.x * TILE_SIZE + TILE_SIZE / 2, 0)
        ctx.lineTo(hoveredTile.x * TILE_SIZE + TILE_SIZE / 2, tileHeight * TILE_SIZE)
        ctx.moveTo(0, hoveredTile.y * TILE_SIZE + TILE_SIZE / 2)
        ctx.lineTo(tileWidth * TILE_SIZE, hoveredTile.y * TILE_SIZE + TILE_SIZE / 2)
        ctx.stroke()
        ctx.setLineDash([])
        
        ctx.fillStyle = 'rgba(0, 255, 136, 0.3)'
        ctx.fillRect(
          hoveredTile.x * TILE_SIZE,
          hoveredTile.y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        )
      } else {
        // Brush mode - show brush size preview
        const startX = Math.max(0, hoveredTile.x - halfBrush)
        const startY = Math.max(0, hoveredTile.y - halfBrush)
        const endX = Math.min(tileWidth - 1, hoveredTile.x + halfBrush)
        const endY = Math.min(tileHeight - 1, hoveredTile.y + halfBrush)
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        for (let ty = startY; ty <= endY; ty++) {
          for (let tx = startX; tx <= endX; tx++) {
            ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
          }
        }
        
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2 / transform.scale
        ctx.strokeRect(
          startX * TILE_SIZE,
          startY * TILE_SIZE,
          (endX - startX + 1) * TILE_SIZE,
          (endY - startY + 1) * TILE_SIZE
        )
      }
    }

    // Draw objects
    ctx.font = `${TILE_SIZE * 0.7}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    objects.forEach(obj => {
      const px = obj.x * TILE_SIZE + TILE_SIZE / 2
      const py = obj.y * TILE_SIZE + TILE_SIZE / 2
      
      // Background
      ctx.fillStyle = selectedObjectInstance === obj.id ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'
      ctx.beginPath()
      ctx.arc(px, py, TILE_SIZE * 0.4, 0, Math.PI * 2)
      ctx.fill()
      
      // Icon
      ctx.fillStyle = '#fff'
      ctx.fillText(OBJECT_ICONS[obj.type], px, py)
      
      // Selection border
      if (selectedObjectInstance === obj.id) {
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 2 / transform.scale
        ctx.stroke()
      }
    })

    // Draw border
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 2 / transform.scale
    ctx.strokeRect(0, 0, tileWidth * TILE_SIZE, tileHeight * TILE_SIZE)

    ctx.restore()

    // Draw info
    ctx.fillStyle = '#666'
    ctx.font = '12px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${t.zoom}: ${Math.round(transform.scale * 100)}%`, canvas.width - 10, canvas.height - 10)
    
    if (hoveredTile) {
      ctx.fillText(`(${hoveredTile.x}, ${hoveredTile.y})`, canvas.width - 10, canvas.height - 26)
    }

  }, [roomDetail, transform, hoveredTile, selectedObject, selectedObjectInstance, brushSize, toolMode, isFilling, fillPreviewBounds, t])

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update hovered tile
    const tile = getTileAtPosition(x, y)
    setHoveredTile(tile)

    // Handle fill mode preview
    if (isFilling && tile && !selectedObject && toolMode === 'fill') {
      updateFillPreview(tile.x, tile.y)
    }
    // Handle painting (brush mode)
    else if (isPainting && tile && !selectedObject && toolMode === 'brush') {
      paintTile(tile.x, tile.y)
    }

    // Handle object dragging
    if (isDraggingObject && tile && selectedObjectInstance) {
      moveSelectedObject(tile.x, tile.y)
    }

    // Handle panning
    updatePan(e)
  }, [getTileAtPosition, isPainting, isFilling, paintTile, selectedObject, updatePan, isDraggingObject, selectedObjectInstance, moveSelectedObject, toolMode, updateFillPreview])

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

    // Left click
    if (e.button === 0) {
      const tile = getTileAtPosition(x, y)
      if (tile) {
        if (selectedObject) {
          handleObjectAction(tile.x, tile.y)
        } else if (selectedObjectInstance) {
          // 오브젝트가 선택된 상태에서 클릭
          const clickedObj = getObjectAtPosition(x, y)
          if (clickedObj && clickedObj.id === selectedObjectInstance) {
            // 선택된 오브젝트 클릭 -> 드래그 시작
            setIsDraggingObject(true)
            setDraggedObjectOrigPos({ x: clickedObj.x, y: clickedObj.y })
          } else {
            // 다른 곳 클릭 -> 선택 해제
            setSelectedObjectInstance(null)
          }
        } else if (toolMode === 'fill') {
          // 채우기 모드 - 드래그로 직사각형 영역 채우기
          setIsFilling(true)
          startFill(tile.x, tile.y)
        } else {
          // 브러시 모드 - 일반 타일 페인팅
          setIsPainting(true)
          startPainting()
          paintTile(tile.x, tile.y)
        }
      }
    }
  }, [getTileAtPosition, getObjectAtPosition, selectedObject, selectedObjectInstance, handleObjectAction, paintTile, startPan, startPainting, toolMode, startFill])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isFilling) {
      endFill() // 채우기 종료 -> 히스토리에 기록
      setIsFilling(false)
    }
    if (isPainting) {
      endPainting() // 브러시 스트로크 종료 -> 히스토리에 기록
      setIsPainting(false)
    }
    if (isDraggingObject) {
      endObjectDrag() // 오브젝트 드래그 종료 -> 히스토리에 기록
    }
    endPan()
  }, [isPainting, isFilling, isDraggingObject, endPainting, endFill, endObjectDrag, endPan])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (isFilling) {
      endFill()
      setIsFilling(false)
    }
    if (isPainting) {
      endPainting()
      setIsPainting(false)
    }
    if (isDraggingObject) {
      endObjectDrag()
    }
    setHoveredTile(null)
    endPan()
  }, [isPainting, isFilling, isDraggingObject, endPainting, endFill, endObjectDrag, endPan])

  // Handle key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectInstance) {
        if ((e.target as HTMLElement).tagName === 'INPUT') return
        deleteSelectedObject()
      }
      if (e.key === 'Escape') {
        setSelectedObjectInstance(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedObjectInstance, deleteSelectedObject])

  // Wheel handler
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

  // Re-render on changes
  useEffect(() => {
    render()
  }, [render])

  // Fit to view on mount
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      fitToView(
        roomDetail.tileWidth * TILE_SIZE,
        roomDetail.tileHeight * TILE_SIZE,
        rect.width,
        rect.height
      )
    }
  }, [roomDetail.tileWidth, roomDetail.tileHeight, fitToView])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: isPainting ? 'crosshair' : 'default',
        backgroundColor: '#0d0d12'
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 10,
        fontSize: 11,
        color: '#555',
        pointerEvents: 'none'
      }}>
        {t.roomEditorInstructions}
      </div>
    </div>
  )
}




