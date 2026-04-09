import type { MapData, Point, Room } from '../types/map'

export interface NavigatorTransform {
  scalePxPerCell: number
  offsetX: number
  offsetY: number
}

export interface RoomCellBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface MapCellBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function getRoomCellBounds(room: Room): RoomCellBounds {
  if (room.rects?.length) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [rx, ry, rw, rh] of room.rects) {
      const x1 = room.x + rx
      const y1 = room.y + ry
      const x2 = x1 + rw
      const y2 = y1 + rh
      if (x1 < minX) minX = x1
      if (y1 < minY) minY = y1
      if (x2 > maxX) maxX = x2
      if (y2 > maxY) maxY = y2
    }
    return { minX, minY, maxX, maxY }
  }

  return {
    minX: room.x,
    minY: room.y,
    maxX: room.x + room.w,
    maxY: room.y + room.h,
  }
}

export function getRoomCenterCell(room: Room): Point {
  const b = getRoomCellBounds(room)
  return {
    x: (b.minX + b.maxX) / 2,
    y: (b.minY + b.maxY) / 2,
  }
}

export function hitTestRoomAtCell(mapData: MapData, cellX: number, cellY: number): Room | null {
  // Reverse order for consistency with MapCanvas (top-most first)
  for (let i = mapData.rooms.length - 1; i >= 0; i--) {
    const room = mapData.rooms[i]
    if (room.rects?.length) {
      for (const [rx, ry, rw, rh] of room.rects) {
        const absX = room.x + rx
        const absY = room.y + ry
        if (cellX >= absX && cellX < absX + rw && cellY >= absY && cellY < absY + rh) {
          return room
        }
      }
      continue
    }

    if (cellX >= room.x && cellX < room.x + room.w && cellY >= room.y && cellY < room.y + room.h) {
      return room
    }
  }

  return null
}

export function getMapCellBounds(mapData: MapData): MapCellBounds {
  if (!mapData.rooms.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const r of mapData.rooms) {
    const b = getRoomCellBounds(r)
    if (b.minX < minX) minX = b.minX
    if (b.minY < minY) minY = b.minY
    if (b.maxX > maxX) maxX = b.maxX
    if (b.maxY > maxY) maxY = b.maxY
  }

  // In case of invalid data, keep it safe
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  return { minX, minY, maxX, maxY }
}

export function isRoomOutsideView(params: {
  viewWidthPx: number
  viewHeightPx: number
  scalePxPerCell: number
  offsetX: number
  offsetY: number
  room: Room
  marginPx?: number
}): boolean {
  const { viewWidthPx, viewHeightPx, scalePxPerCell, offsetX, offsetY, room, marginPx = 0 } = params
  if (scalePxPerCell <= 0) return true

  // View bounds in cell space (exclusive max, consistent with room bounds)
  const viewMinX = (0 + marginPx - offsetX) / scalePxPerCell
  const viewMinY = (0 + marginPx - offsetY) / scalePxPerCell
  const viewMaxX = (viewWidthPx - marginPx - offsetX) / scalePxPerCell
  const viewMaxY = (viewHeightPx - marginPx - offsetY) / scalePxPerCell

  const b = getRoomCellBounds(room)

  const intersects =
    b.maxX > viewMinX &&
    b.minX < viewMaxX &&
    b.maxY > viewMinY &&
    b.minY < viewMaxY

  return !intersects
}

export function clampNavigatorOffset(params: {
  viewWidthPx: number
  viewHeightPx: number
  scalePxPerCell: number
  offsetX: number
  offsetY: number
  mapBounds: MapCellBounds
  marginPx?: number
}): { offsetX: number; offsetY: number } {
  const { viewWidthPx, viewHeightPx, scalePxPerCell, offsetX, offsetY, mapBounds, marginPx = 0 } = params

  // If we have no content bounds, don't clamp.
  const hasContent =
    Number.isFinite(mapBounds.minX) &&
    Number.isFinite(mapBounds.minY) &&
    Number.isFinite(mapBounds.maxX) &&
    Number.isFinite(mapBounds.maxY) &&
    (mapBounds.maxX > mapBounds.minX || mapBounds.maxY > mapBounds.minY)

  if (!hasContent || scalePxPerCell <= 0) return { offsetX, offsetY }

  const contentWidthPx = (mapBounds.maxX - mapBounds.minX) * scalePxPerCell
  const contentHeightPx = (mapBounds.maxY - mapBounds.minY) * scalePxPerCell

  const minOffsetX = marginPx - mapBounds.maxX * scalePxPerCell
  const maxOffsetX = viewWidthPx - marginPx - mapBounds.minX * scalePxPerCell
  const minOffsetY = marginPx - mapBounds.maxY * scalePxPerCell
  const maxOffsetY = viewHeightPx - marginPx - mapBounds.minY * scalePxPerCell

  // If content is smaller than view (considering margins), center it.
  const centeredOffsetX = (viewWidthPx - contentWidthPx) / 2 - mapBounds.minX * scalePxPerCell
  const centeredOffsetY = (viewHeightPx - contentHeightPx) / 2 - mapBounds.minY * scalePxPerCell

  const clampedX = minOffsetX > maxOffsetX ? centeredOffsetX : Math.min(maxOffsetX, Math.max(minOffsetX, offsetX))
  const clampedY = minOffsetY > maxOffsetY ? centeredOffsetY : Math.min(maxOffsetY, Math.max(minOffsetY, offsetY))

  return { offsetX: clampedX, offsetY: clampedY }
}

export function computeCenteredTransformForRoom(params: {
  viewWidthPx: number
  viewHeightPx: number
  scalePxPerCell: number
  room: Room
}): NavigatorTransform {
  const { viewWidthPx, viewHeightPx, scalePxPerCell, room } = params
  const c = getRoomCenterCell(room)
  return {
    scalePxPerCell,
    offsetX: viewWidthPx / 2 - c.x * scalePxPerCell,
    offsetY: viewHeightPx / 2 - c.y * scalePxPerCell,
  }
}

