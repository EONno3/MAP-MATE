import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Connection, MapData, Room } from '../../types/map'
import { GATE_COLORS } from '../../types/map'
import { clampNavigatorOffset, computeCenteredTransformForRoom, getMapCellBounds, hitTestRoomAtCell, isRoomOutsideView } from '../../lib/roomNavigatorMath'
import { buildRoomNavigatorTooltip } from '../../lib/roomNavigatorTooltip'

export interface RoomNavigatorCanvasProps {
  mapData: MapData
  currentRoom: Room
  connections?: Connection[]
  onDoubleClickRoom?: (roomId: number) => void
  className?: string
}

type NavigatorTransformState = {
  scalePxPerCell: number
  offsetX: number
  offsetY: number
}

const DEFAULT_SCALE_PX_PER_CELL = 12
const MIN_SCALE_PX_PER_CELL = 2
const MAX_SCALE_PX_PER_CELL = 64
const ZOOM_SENSITIVITY = 0.001
const DRAG_THRESHOLD_PX = 2
const CLAMP_MARGIN_PX = 120

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function RoomNavigatorCanvas({
  mapData,
  currentRoom,
  connections = [],
  onDoubleClickRoom,
  className,
}: RoomNavigatorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [viewSize, setViewSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [transform, setTransform] = useState<NavigatorTransformState>({
    scalePxPerCell: DEFAULT_SCALE_PX_PER_CELL,
    offsetX: 0,
    offsetY: 0,
  })

  const suppressDoubleClickRef = useRef(false)
  const suppressDoubleClickTimerRef = useRef<number | null>(null)

  const dragRef = useRef<null | {
    startX: number
    startY: number
    startOffsetX: number
    startOffsetY: number
    didMove: boolean
  }>(null)

  const drawRooms = useCallback((ctx: CanvasRenderingContext2D) => {
    const rooms = mapData.rooms

    for (const r of rooms) {
      const isCurrent = r.id === currentRoom.id

      ctx.fillStyle = isCurrent ? 'rgba(59, 130, 246, 0.40)' : 'rgba(255, 255, 255, 0.10)'
      ctx.fillRect(r.x, r.y, r.w, r.h)

      ctx.strokeStyle = isCurrent ? '#60a5fa' : '#555'
      ctx.lineWidth = isCurrent ? 0.2 : 0.1
      ctx.strokeRect(r.x, r.y, r.w, r.h)

      // Draw grid interior lines for bigger rooms
      if (r.w > 1 || r.h > 1) {
        ctx.beginPath()
        for (let ix = 1; ix < r.w; ix++) {
          ctx.moveTo(r.x + ix, r.y)
          ctx.lineTo(r.x + ix, r.y + r.h)
        }
        for (let iy = 1; iy < r.h; iy++) {
          ctx.moveTo(r.x, r.y + iy)
          ctx.lineTo(r.x + r.w, r.y + iy)
        }
        ctx.strokeStyle = isCurrent ? 'rgba(96, 165, 250, 0.30)' : 'rgba(255, 255, 255, 0.05)'
        ctx.lineWidth = 0.05
        ctx.stroke()
      }
    }
  }, [mapData.rooms, currentRoom.id])

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!connections.length) return

    for (const conn of connections) {
      const fromRoom = mapData.rooms.find(r => r.id === conn.fromId)
      const toRoom = mapData.rooms.find(r => r.id === conn.toId)
      if (!fromRoom || !toRoom) continue

      ctx.beginPath()
      ctx.strokeStyle = GATE_COLORS[conn.condition] || '#888'
      ctx.lineWidth = 0.2
      if (conn.condition !== 'none') {
        ctx.setLineDash([0.5, 0.3])
      } else {
        ctx.setLineDash([])
      }

      ctx.moveTo(fromRoom.x + fromRoom.w / 2, fromRoom.y + fromRoom.h / 2)
      ctx.lineTo(toRoom.x + toRoom.w / 2, toRoom.y + toRoom.h / 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [connections, mapData.rooms])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width))
    const height = Math.max(1, Math.floor(rect.height))

    const nextW = Math.floor(width * dpr)
    const nextH = Math.floor(height * dpr)
    if (canvas.width !== nextW) canvas.width = nextW
    if (canvas.height !== nextH) canvas.height = nextH

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    ctx.save()
    ctx.translate(transform.offsetX, transform.offsetY)
    ctx.scale(transform.scalePxPerCell, transform.scalePxPerCell)

    drawConnections(ctx)
    drawRooms(ctx)

    ctx.restore()
  }, [drawConnections, drawRooms, transform.offsetX, transform.offsetY, transform.scalePxPerCell])

  // Center on current room when it changes (keep current zoom level)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    setTransform((prev) => {
      const centered = computeCenteredTransformForRoom({
        viewWidthPx: rect.width,
        viewHeightPx: rect.height,
        scalePxPerCell: prev.scalePxPerCell || DEFAULT_SCALE_PX_PER_CELL,
        room: currentRoom,
      })
      const mapBounds = getMapCellBounds(mapData)
      const clamped = clampNavigatorOffset({
        viewWidthPx: rect.width,
        viewHeightPx: rect.height,
        scalePxPerCell: centered.scalePxPerCell,
        offsetX: centered.offsetX,
        offsetY: centered.offsetY,
        mapBounds,
        marginPx: CLAMP_MARGIN_PX,
      })
      return {
        scalePxPerCell: centered.scalePxPerCell,
        offsetX: clamped.offsetX,
        offsetY: clamped.offsetY,
      }
    })
  }, [currentRoom.id, mapData])

  // Re-render on any relevant changes
  useEffect(() => {
    render()
  }, [render, mapData, currentRoom, connections])

  // Track resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      const rect = container.getBoundingClientRect()
      setViewSize({ w: Math.max(1, Math.floor(rect.width)), h: Math.max(1, Math.floor(rect.height)) })
      render()
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(container)
    return () => ro.disconnect()
  }, [render])

  const screenToCell = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - transform.offsetX) / transform.scalePxPerCell,
      y: (screenY - transform.offsetY) / transform.scalePxPerCell,
    }
  }, [transform.offsetX, transform.offsetY, transform.scalePxPerCell])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    setTransform((prev) => {
      const zoomFactor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY)
      const nextScale = clamp(prev.scalePxPerCell * zoomFactor, MIN_SCALE_PX_PER_CELL, MAX_SCALE_PX_PER_CELL)

      const worldX = (point.x - prev.offsetX) / prev.scalePxPerCell
      const worldY = (point.y - prev.offsetY) / prev.scalePxPerCell

      const nextOffsetX = point.x - worldX * nextScale
      const nextOffsetY = point.y - worldY * nextScale

      const mapBounds = getMapCellBounds(mapData)
      const clamped = clampNavigatorOffset({
        viewWidthPx: rect.width,
        viewHeightPx: rect.height,
        scalePxPerCell: nextScale,
        offsetX: nextOffsetX,
        offsetY: nextOffsetY,
        mapBounds,
        marginPx: CLAMP_MARGIN_PX,
      })
      return { scalePxPerCell: nextScale, offsetX: clamped.offsetX, offsetY: clamped.offsetY }
    })
  }, [mapData])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel as any)
  }, [handleWheel])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDragging(true)
    dragRef.current = {
      startX: x,
      startY: y,
      startOffsetX: transform.offsetX,
      startOffsetY: transform.offsetY,
      didMove: false,
    }
  }, [transform.offsetX, transform.offsetY])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })

    const drag = dragRef.current
    if (!drag) {
      if (!isDragging) {
        const cell = screenToCell(x, y)
        const hit = hitTestRoomAtCell(mapData, cell.x, cell.y)
        setHoveredRoom(hit)
      }
      return
    }

    const dx = x - drag.startX
    const dy = y - drag.startY
    if (!drag.didMove && (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)) {
      drag.didMove = true
    }

    setTransform((prev) => {
      const mapBounds = getMapCellBounds(mapData)
      const clamped = clampNavigatorOffset({
        viewWidthPx: rect.width,
        viewHeightPx: rect.height,
        scalePxPerCell: prev.scalePxPerCell,
        offsetX: drag.startOffsetX + dx,
        offsetY: drag.startOffsetY + dy,
        mapBounds,
        marginPx: CLAMP_MARGIN_PX,
      })
      return { ...prev, offsetX: clamped.offsetX, offsetY: clamped.offsetY }
    })
  }, [isDragging, mapData, screenToCell])

  const handleMouseUp = useCallback(() => {
    const drag = dragRef.current
    dragRef.current = null
    setIsDragging(false)
    if (drag?.didMove) {
      suppressDoubleClickRef.current = true
      if (suppressDoubleClickTimerRef.current) {
        window.clearTimeout(suppressDoubleClickTimerRef.current)
      }
      suppressDoubleClickTimerRef.current = window.setTimeout(() => {
        suppressDoubleClickRef.current = false
        suppressDoubleClickTimerRef.current = null
      }, 250)
    }
  }, [])

  // Ensure drag ends even if mouseup happens outside
  useEffect(() => {
    const onWinUp = () => {
      dragRef.current = null
      setIsDragging(false)
    }
    window.addEventListener('mouseup', onWinUp)
    return () => window.removeEventListener('mouseup', onWinUp)
  }, [])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (suppressDoubleClickRef.current) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const cell = screenToCell(x, y)
    const hit = hitTestRoomAtCell(mapData, cell.x, cell.y)
    if (!hit) return
    if (!onDoubleClickRoom) return
    onDoubleClickRoom(hit.id)
  }, [mapData, onDoubleClickRoom, screenToCell])

  const showRecenter = useMemo(() => {
    if (!viewSize.w || !viewSize.h) return false
    return isRoomOutsideView({
      viewWidthPx: viewSize.w,
      viewHeightPx: viewSize.h,
      scalePxPerCell: transform.scalePxPerCell,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
      room: currentRoom,
      marginPx: 0,
    })
  }, [currentRoom, transform.offsetX, transform.offsetY, transform.scalePxPerCell, viewSize.h, viewSize.w])

  const recenter = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setTransform((prev) => {
      const centered = computeCenteredTransformForRoom({
        viewWidthPx: rect.width,
        viewHeightPx: rect.height,
        scalePxPerCell: prev.scalePxPerCell,
        room: currentRoom,
      })
      const clamped = clampNavigatorOffset({
        viewWidthPx: rect.width,
        viewHeightPx: rect.height,
        scalePxPerCell: centered.scalePxPerCell,
        offsetX: centered.offsetX,
        offsetY: centered.offsetY,
        mapBounds: getMapCellBounds(mapData),
        marginPx: CLAMP_MARGIN_PX,
      })
      return { scalePxPerCell: centered.scalePxPerCell, offsetX: clamped.offsetX, offsetY: clamped.offsetY }
    })
  }, [currentRoom, mapData])

  const cursor = useMemo(() => (isDragging ? 'grabbing' : 'grab'), [isDragging])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', cursor, overflow: 'hidden', position: 'relative' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { handleMouseUp(); setHoveredRoom(null) }}
      onDoubleClick={handleDoubleClick}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {showRecenter && (
        <button
          onClick={(e) => { e.stopPropagation(); recenter() }}
          className="btn-base btn-secondary"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '6px 10px',
            fontSize: 11,
            zIndex: 5,
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid var(--border-light)',
          }}
          title="현재 방으로 이동"
        >
          현재 방으로
        </button>
      )}

      {hoveredRoom && !isDragging && (
        (() => {
          const tip = buildRoomNavigatorTooltip({ room: hoveredRoom, zones: mapData.zones })
          return (
            <div
              style={{
                position: 'absolute',
                left: clamp(mousePos.x + 12, 8, Math.max(8, viewSize.w - 280)),
                top: clamp(mousePos.y + 12, 8, Math.max(8, viewSize.h - 72)),
                zIndex: 6,
                pointerEvents: 'none',
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid var(--border-light)',
                background: 'rgba(13, 13, 18, 0.88)',
                color: 'var(--text-main)',
                fontSize: 11,
                boxShadow: 'var(--shadow-md)',
                maxWidth: 280,
              }}
            >
              <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tip.title}
              </div>
              <div style={{ marginTop: 2, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {tip.zoneColor ? (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: tip.zoneColor,
                      border: '1px solid rgba(255,255,255,0.25)',
                      flex: '0 0 auto',
                    }}
                  />
                ) : null}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tip.subtitle}
                </span>
              </div>
            </div>
          )
        })()
      )}
    </div>
  )
}

