import React, { useRef, useEffect, useCallback, useState } from 'react'
import {
  RoomDetail, TileType, ObjectType, RoomObject,
  TILE_COLORS, OBJECT_ICONS, TILE_SIZE
} from '../../types/map'
import { useCanvasTransform } from '../../hooks/useCanvasTransform'
import { Translations } from '../../i18n/translations'
import { getSquareBrushBounds } from '../../lib/brushBounds'
import { drawSvgIcon } from '../../lib/iconRenderer'

export type RoomToolMode = 'brush' | 'fill'

interface RoomCanvasProps {
  roomDetail: RoomDetail
  activeLayerId: string
  selectedTile: TileType
  selectedObject: ObjectType | null
  brushSize: number
  toolMode: RoomToolMode
  onUpdateActiveLayerTiles: (tiles: TileType[][], recordHistory?: boolean) => void
  onUpdateActiveLayerObjects: (objects: RoomObject[], recordHistory?: boolean) => void
  selectedObjectInstance: string | null
  onSelectObjectInstance: (objectId: string | null) => void
  tileColors?: Record<string, string>
  t: Translations
}

export function RoomCanvas({
  roomDetail,
  activeLayerId,
  selectedTile,
  selectedObject,
  brushSize,
  toolMode,
  onUpdateActiveLayerTiles,
  onUpdateActiveLayerObjects,
  selectedObjectInstance,
  onSelectObjectInstance,
  tileColors,
  t
}: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPainting, setIsPainting] = useState(false)
  const isPaintingRef = useRef(false)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)

  // Painting state - useRef를 사용하여 최신 값을 항상 참조
  const paintingTilesRef = useRef<TileType[][] | null>(null)
  const [isDraggingObject, setIsDraggingObject] = useState(false)
  const isDraggingObjectRef = useRef(false)
  const [draggedObjectOrigPos, setDraggedObjectOrigPos] = useState<{ x: number; y: number } | null>(null)

  // Fill tool state - 드래그로 직사각형 영역 채우기 (ref로 관리하여 클로저 문제 방지)
  const [isFilling, setIsFilling] = useState(false)
  const isFillingRef = useRef(false)
  const fillStartRef = useRef<{ x: number; y: number } | null>(null)
  const fillEndRef = useRef<{ x: number; y: number } | null>(null)
  const fillPreviewTilesRef = useRef<TileType[][] | null>(null)
  // 렌더링용 상태 (프리뷰 박스 표시)
  const [fillPreviewBounds, setFillPreviewBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null)

  // Image caching for image layers
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({})
  const [imageTick, setImageTick] = useState(0) // Hack to trigger re-render when image loads

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

  // Spacebar panning state
  const [isSpaceDown, setIsSpaceDown] = useState(false)

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

    for (const layer of roomDetail.layers) {
      if (layer.type === 'object' && layer.visible && layer.objects) {
        const obj = layer.objects.find(o => o.x === tileX && o.y === tileY)
        if (obj) return obj
      }
    }
    return null
  }, [roomDetail, screenToWorld])

  const activeTileLayer = roomDetail.layers.find(l => l.id === activeLayerId && l.type === 'tile')
  const activeObjectLayer = roomDetail.layers.find(l => l.id === activeLayerId && l.type === 'object')

  // Start painting - 시작 시 현재 타일 상태를 복사
  const startPainting = useCallback(() => {
    if (activeTileLayer && activeTileLayer.tiles) {
      paintingTilesRef.current = activeTileLayer.tiles.map(row => [...row])
    }
  }, [activeTileLayer])

  // Paint tile at position with brush size - 페인팅 중에는 임시 타일에만 적용
  const paintTile = useCallback((x: number, y: number) => {
    if (selectedObject) return // Don't paint tiles when object mode is active
    if (!paintingTilesRef.current) return

    let changed = false

    const bounds = getSquareBrushBounds({
      x,
      y,
      size: brushSize,
      maxX: roomDetail.tileWidth - 1,
      maxY: roomDetail.tileHeight - 1,
    })

    for (let ty = bounds.startY; ty <= bounds.endY; ty++) {
      for (let tx = bounds.startX; tx <= bounds.endX; tx++) {
        if (paintingTilesRef.current[ty][tx] !== selectedTile) {
          paintingTilesRef.current[ty][tx] = selectedTile
          changed = true
        }
      }
    }

    if (changed) {
      // 화면에 즉시 반영 (히스토리 기록 안함)
      const newTiles = paintingTilesRef.current.map(row => [...row])
      onUpdateActiveLayerTiles(newTiles, false)
    }
  }, [roomDetail.tileWidth, roomDetail.tileHeight, selectedTile, selectedObject, brushSize, onUpdateActiveLayerTiles])

  // End painting - 완료 시 히스토리에 기록
  const endPainting = useCallback(() => {
    if (paintingTilesRef.current) {
      const finalTiles = paintingTilesRef.current.map(row => [...row])
      onUpdateActiveLayerTiles(finalTiles, true)
      paintingTilesRef.current = null
    }
  }, [onUpdateActiveLayerTiles])

  // Fill rectangle area - 드래그로 직사각형 영역 채우기
  const startFill = useCallback((x: number, y: number) => {
    if (activeTileLayer && activeTileLayer.tiles) {
      fillPreviewTilesRef.current = activeTileLayer.tiles.map(row => [...row])
      fillStartRef.current = { x, y }
      fillEndRef.current = { x, y }
      setFillPreviewBounds({ minX: x, maxX: x, minY: y, maxY: y })
    }
  }, [activeTileLayer])

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
    if (!activeTileLayer || !activeTileLayer.tiles) return
    const previewTiles = activeTileLayer.tiles.map(row => [...row])
    for (let ty = minY; ty <= maxY; ty++) {
      for (let tx = minX; tx <= maxX; tx++) {
        previewTiles[ty][tx] = selectedTile
      }
    }

    fillPreviewTilesRef.current = previewTiles
    onUpdateActiveLayerTiles(previewTiles, false)
  }, [roomDetail, selectedTile, activeTileLayer, onUpdateActiveLayerTiles])

  const endFill = useCallback(() => {
    if (fillPreviewTilesRef.current) {
      const finalTiles = fillPreviewTilesRef.current.map(row => [...row])
      onUpdateActiveLayerTiles(finalTiles, true)
    }
    fillPreviewTilesRef.current = null
    fillStartRef.current = null
    fillEndRef.current = null
    setFillPreviewBounds(null)
  }, [onUpdateActiveLayerTiles])

  // Place or remove object
  const handleObjectAction = useCallback((x: number, y: number) => {
    if (!selectedObject) {
      const obj = getObjectAtPosition(x, y)
      if (obj) {
        if (selectedObjectInstance === obj.id) {
          // Already selected, start dragging
          setIsDraggingObject(true)
          setDraggedObjectOrigPos({ x: obj.x, y: obj.y })
        } else {
          // Select the object
          onSelectObjectInstance(obj.id)
        }
      } else {
        // Click on empty space, deselect
        onSelectObjectInstance(null)
      }
      return
    }

    if (!activeObjectLayer || !activeObjectLayer.objects) return

    // Check if there's already an object at this position
    const existingIndex = activeObjectLayer.objects.findIndex(o => o.x === x && o.y === y)

    if (existingIndex >= 0) {
      // Remove existing object
      const newObjects = activeObjectLayer.objects.filter((_, i) => i !== existingIndex)
      onUpdateActiveLayerObjects(newObjects, true)
    } else {
      // Add new object
      const newObject: RoomObject = {
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: selectedObject,
        x,
        y
      }
      onUpdateActiveLayerObjects([...activeObjectLayer.objects, newObject], true)
    }
  }, [selectedObject, activeObjectLayer, selectedObjectInstance, onUpdateActiveLayerObjects, getObjectAtPosition])

  // Move selected object
  const moveSelectedObject = useCallback((x: number, y: number) => {
    if (!selectedObjectInstance || !isDraggingObject || !activeObjectLayer || !activeObjectLayer.objects) return

    const newObjects = activeObjectLayer.objects.map(obj =>
      obj.id === selectedObjectInstance ? { ...obj, x, y } : obj
    )
    onUpdateActiveLayerObjects(newObjects, false) // 드래그 중에는 히스토리 기록 안함
  }, [selectedObjectInstance, isDraggingObject, activeObjectLayer, onUpdateActiveLayerObjects])

  // End object drag
  const endObjectDrag = useCallback(() => {
    if (isDraggingObject && selectedObjectInstance && draggedObjectOrigPos && activeObjectLayer && activeObjectLayer.objects) {
      const obj = activeObjectLayer.objects.find(o => o.id === selectedObjectInstance)
      if (obj && (obj.x !== draggedObjectOrigPos.x || obj.y !== draggedObjectOrigPos.y)) {
        onUpdateActiveLayerObjects(activeObjectLayer.objects, true)
      }
    }
    setIsDraggingObject(false)
    setDraggedObjectOrigPos(null)
  }, [isDraggingObject, selectedObjectInstance, draggedObjectOrigPos, activeObjectLayer, onUpdateActiveLayerObjects])

  // Delete selected object
  const deleteSelectedObject = useCallback(() => {
    if (selectedObjectInstance && activeObjectLayer && activeObjectLayer.objects) {
      const newObjects = activeObjectLayer.objects.filter(o => o.id !== selectedObjectInstance)
      onUpdateActiveLayerObjects(newObjects)
      onSelectObjectInstance(null)
    }
  }, [selectedObjectInstance, activeObjectLayer, onUpdateActiveLayerObjects, onSelectObjectInstance])

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

    const { tileWidth, tileHeight, layers } = roomDetail

    // Draw grid background
    ctx.fillStyle = '#0d0d12'
    ctx.fillRect(0, 0, tileWidth * TILE_SIZE, tileHeight * TILE_SIZE)

    // Render layers in sequence
    for (const layer of layers) {
      if (!layer.visible) continue
      ctx.globalAlpha = layer.opacity

      if (layer.type === 'tile' && layer.tiles) {
        for (let y = 0; y < tileHeight; y++) {
          for (let x = 0; x < tileWidth; x++) {
            const tile = layer.tiles[y]?.[x] || 'empty'
            const px = x * TILE_SIZE
            const py = y * TILE_SIZE

            if (tile !== 'empty') {
              ctx.fillStyle = (tileColors?.[tile] ?? TILE_COLORS[tile]) as string
              ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE)

              // Auto-tiling contiguous borders (Bevel effect)
              const top = layer.tiles[y - 1]?.[x]
              const bottom = layer.tiles[y + 1]?.[x]
              const left = layer.tiles[y]?.[x - 1]
              const right = layer.tiles[y]?.[x + 1]

              ctx.lineWidth = 2 / transform.scale

              if (top !== tile) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_SIZE, py); ctx.stroke();
              }
              if (left !== tile) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + TILE_SIZE); ctx.stroke();
              }
              if (bottom !== tile) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.beginPath(); ctx.moveTo(px, py + TILE_SIZE); ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE); ctx.stroke();
              }
              if (right !== tile) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.beginPath(); ctx.moveTo(px + TILE_SIZE, py); ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE); ctx.stroke();
              }
            }
          }
        }
      } else if (layer.type === 'object' && layer.objects) {
        ctx.font = `${TILE_SIZE * 0.7}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        layer.objects.forEach(obj => {
          const px = obj.x * TILE_SIZE + TILE_SIZE / 2
          const py = obj.y * TILE_SIZE + TILE_SIZE / 2

          ctx.fillStyle = selectedObjectInstance === obj.id ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)'
          ctx.beginPath()
          ctx.arc(px, py, TILE_SIZE * 0.4, 0, Math.PI * 2)
          ctx.fill()

          drawSvgIcon(ctx, obj.type, px, py, TILE_SIZE * 0.6, '#fff', () => setImageTick(prev => prev + 1))

          if (selectedObjectInstance === obj.id) {
            ctx.strokeStyle = '#FFD700'
            ctx.lineWidth = 2 / transform.scale
            ctx.stroke()
          }
        })
      } else if (layer.type === 'image' && layer.imageUrl) {
        const cached = imageCacheRef.current[layer.imageUrl]
        if (cached && cached.complete && cached.naturalWidth > 0) {
          ctx.drawImage(cached, 0, 0, tileWidth * TILE_SIZE, tileHeight * TILE_SIZE)
        } else if (!cached) {
          const img = new Image()
          img.src = layer.imageUrl
          img.onload = () => setImageTick(prev => prev + 1)
          imageCacheRef.current[layer.imageUrl] = img
        }
      }
    }

    ctx.globalAlpha = 1

    // Draw grid lines
    ctx.strokeStyle = '#2a2a34'
    ctx.lineWidth = 0.5 / transform.scale
    for (let y = 0; y < tileHeight; y++) {
      for (let x = 0; x < tileWidth; x++) {
        const px = x * TILE_SIZE
        const py = y * TILE_SIZE
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
        const bounds = getSquareBrushBounds({
          x: hoveredTile.x,
          y: hoveredTile.y,
          size: brushSize,
          maxX: tileWidth - 1,
          maxY: tileHeight - 1,
        })

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        for (let ty = bounds.startY; ty <= bounds.endY; ty++) {
          for (let tx = bounds.startX; tx <= bounds.endX; tx++) {
            ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
          }
        }

        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2 / transform.scale
        ctx.strokeRect(
          bounds.startX * TILE_SIZE,
          bounds.startY * TILE_SIZE,
          (bounds.endX - bounds.startX + 1) * TILE_SIZE,
          (bounds.endY - bounds.startY + 1) * TILE_SIZE
        )
      }
    }

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

  }, [roomDetail, transform, hoveredTile, selectedObject, selectedObjectInstance, brushSize, toolMode, isFilling, fillPreviewBounds, tileColors, t, imageTick])

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

    // Middle mouse or Shift+Left or Space+Left for panning
    if (e.button === 1 || (e.button === 0 && (e.shiftKey || isSpaceDown))) {
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
            isDraggingObjectRef.current = true
            setDraggedObjectOrigPos({ x: clickedObj.x, y: clickedObj.y })
          } else {
            // 다른 곳 클릭 -> 선택 해제
            onSelectObjectInstance(null)
          }
        } else if (toolMode === 'fill') {
          // 채우기 모드 - 드래그로 직사각형 영역 채우기
          setIsFilling(true)
          isFillingRef.current = true
          startFill(tile.x, tile.y)
        } else {
          // 브러시 모드 - 일반 타일 페인팅
          setIsPainting(true)
          isPaintingRef.current = true
          startPainting()
          paintTile(tile.x, tile.y)
        }
      }
    }
  }, [getTileAtPosition, getObjectAtPosition, selectedObject, selectedObjectInstance, handleObjectAction, paintTile, startPan, startPainting, toolMode, startFill, isSpaceDown])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isFillingRef.current) {
      endFill() // 채우기 종료 -> 히스토리에 기록
      setIsFilling(false)
      isFillingRef.current = false
    }
    if (isPaintingRef.current) {
      endPainting() // 브러시 스트로크 종료 -> 히스토리에 기록
      setIsPainting(false)
      isPaintingRef.current = false
    }
    if (isDraggingObjectRef.current) {
      endObjectDrag() // 오브젝트 드래그 종료 -> 히스토리에 기록
      isDraggingObjectRef.current = false
      setIsDraggingObject(false)
    }
    endPan()
  }, [endPainting, endFill, endObjectDrag, endPan])

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    if (isFillingRef.current) {
      endFill()
      setIsFilling(false)
      isFillingRef.current = false
    }
    if (isPaintingRef.current) {
      endPainting()
      setIsPainting(false)
      isPaintingRef.current = false
    }
    if (isDraggingObjectRef.current) {
      endObjectDrag()
      isDraggingObjectRef.current = false
      setIsDraggingObject(false)
    }
    setHoveredTile(null)
    endPan()
  }, [endPainting, endFill, endObjectDrag, endPan])

  // IMPORTANT: 캔버스 밖에서 mouseup이 발생하면 onMouseUp이 호출되지 않아
  // 스트로크가 커밋되지 않고 Undo가 영원히 비활성일 수 있다.
  useEffect(() => {
    const onWindowMouseUp = () => {
      if (isPaintingRef.current || isFillingRef.current || isDraggingObjectRef.current || isPanning) {
        handleMouseUp()
      }
    }
    window.addEventListener('mouseup', onWindowMouseUp)
    return () => window.removeEventListener('mouseup', onWindowMouseUp)
  }, [handleMouseUp, isPanning])

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

  // Handle key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectInstance) {
        if ((e.target as HTMLElement).tagName === 'INPUT') return
        deleteSelectedObject()
      }
      if (e.key === 'Escape') {
        onSelectObjectInstance(null)
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
      data-tutorial="canvas-view"
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: isSpaceDown ? (isPanning ? 'grabbing' : 'grab') : (isPainting ? 'crosshair' : 'default'),
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
        bottom: 20,
        right: 20,
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'right',
        pointerEvents: 'none',
        zIndex: 50
      }}>
        {t.roomEditorInstructions}
      </div>
    </div>
  )
}




