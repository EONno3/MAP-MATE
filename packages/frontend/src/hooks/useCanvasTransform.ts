import { useState, useCallback, useRef, useEffect } from 'react'
import { CanvasTransform, Point } from '../types/map'

const MIN_SCALE = 0.1
const MAX_SCALE = 5
const ZOOM_SENSITIVITY = 0.001

interface UseCanvasTransformOptions {
  initialScale?: number
  initialOffset?: Point
}

export function useCanvasTransform(options: UseCanvasTransformOptions = {}) {
  const { initialScale = 1, initialOffset = { x: 0, y: 0 } } = options

  const [transform, setTransform] = useState<CanvasTransform>({
    scale: initialScale,
    offsetX: initialOffset.x,
    offsetY: initialOffset.y
  })

  const isPanning = useRef(false)
  const lastMousePos = useRef<Point>({ x: 0, y: 0 })

  // Zoom at a specific point (for mouse wheel zoom)
  const zoomAtPoint = useCallback((delta: number, point: Point) => {
    setTransform(prev => {
      const zoomFactor = Math.exp(-delta * ZOOM_SENSITIVITY)
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * zoomFactor))
      const scaleRatio = newScale / prev.scale

      // Zoom towards the mouse position
      const newOffsetX = point.x - (point.x - prev.offsetX) * scaleRatio
      const newOffsetY = point.y - (point.y - prev.offsetY) * scaleRatio

      return {
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      }
    })
  }, [])

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    zoomAtPoint(e.deltaY, point)
  }, [zoomAtPoint])

  // Start panning
  const startPan = useCallback((e: React.MouseEvent) => {
    isPanning.current = true
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  // Update pan position
  const updatePan = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return

    const dx = e.clientX - lastMousePos.current.x
    const dy = e.clientY - lastMousePos.current.y

    setTransform(prev => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy
    }))

    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  // End panning
  const endPan = useCallback(() => {
    isPanning.current = false
  }, [])

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    return {
      x: (screenX - transform.offsetX) / transform.scale,
      y: (screenY - transform.offsetY) / transform.scale
    }
  }, [transform])

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number): Point => {
    return {
      x: worldX * transform.scale + transform.offsetX,
      y: worldY * transform.scale + transform.offsetY
    }
  }, [transform])

  // Reset transform to initial values
  const resetTransform = useCallback(() => {
    setTransform({
      scale: initialScale,
      offsetX: initialOffset.x,
      offsetY: initialOffset.y
    })
  }, [initialScale, initialOffset])

  // Fit content to view
  const fitToView = useCallback((contentWidth: number, contentHeight: number, viewWidth: number, viewHeight: number) => {
    const scaleX = viewWidth / contentWidth
    const scaleY = viewHeight / contentHeight
    const newScale = Math.min(scaleX, scaleY, MAX_SCALE) * 0.9 // 90% to add padding

    const offsetX = (viewWidth - contentWidth * newScale) / 2
    const offsetY = (viewHeight - contentHeight * newScale) / 2

    setTransform({
      scale: newScale,
      offsetX,
      offsetY
    })
  }, [])

  return {
    transform,
    setTransform,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    isPanning: isPanning.current,
    screenToWorld,
    worldToScreen,
    resetTransform,
    fitToView,
    zoomAtPoint
  }
}




