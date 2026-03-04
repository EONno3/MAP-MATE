import { useState, useCallback, useMemo } from 'react'
import {
  Room,
  RoomDetail,
  TileType,
  ObjectType,
  RoomObject,
  TILES_PER_CHUNK_X,
  TILES_PER_CHUNK_Y
} from '../types/map'
import { useHistory } from './useHistory'

export type RoomEditorTool = 'brush' | 'fill' | 'eraser' | 'object' | 'select'

interface UseRoomEditorReturn {
  // State
  editingRoom: Room | null
  roomDetail: RoomDetail | null
  activeLayerId: string
  selectedTile: TileType
  selectedObject: ObjectType | null
  currentTool: RoomEditorTool

  // History
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void

  // Actions
  setEditingRoom: (room: Room | null) => void
  setActiveLayerId: (id: string) => void
  setSelectedTile: (tile: TileType) => void
  setSelectedObject: (obj: ObjectType | null) => void
  setCurrentTool: (tool: RoomEditorTool) => void
  updateTile: (x: number, y: number, tileType: TileType) => void
  fillTiles: (startX: number, startY: number, tileType: TileType) => void
  placeObject: (x: number, y: number, objectType: ObjectType) => void
  deleteObject: (objectId: string) => void
  moveObject: (objectId: string, newX: number, newY: number) => void
  resetRoomDetail: () => void
  setRoomDetail: (detail: RoomDetail) => void
  generateFromPrompt: (prompt: string) => Promise<void>
}

// API URL
const API_URL = import.meta.env.VITE_API_URL || ''

export function useRoomEditor(initialRoom: Room | null = null): UseRoomEditorReturn {
  const [editingRoom, setEditingRoomState] = useState<Room | null>(initialRoom)
  const [activeLayerId, setActiveLayerId] = useState<string>('layer_base')
  const [selectedTile, setSelectedTile] = useState<TileType>('solid')
  const [selectedObject, setSelectedObject] = useState<ObjectType | null>(null)
  const [currentTool, setCurrentTool] = useState<RoomEditorTool>('brush')

  // 기본 상세맵 생성
  const generateDefaultRoomDetail = useCallback((room: Room): RoomDetail => {
    const tileWidth = room.w * TILES_PER_CHUNK_X
    const tileHeight = room.h * TILES_PER_CHUNK_Y

    // 벽으로 둘러싸인 빈 방 생성
    const tiles: TileType[][] = Array(tileHeight).fill(null).map((_, y) =>
      Array(tileWidth).fill(null).map((_, x) => {
        if (y === 0 || y === tileHeight - 1) return 'solid' // 천장/바닥
        if (x === 0 || x === tileWidth - 1) return 'solid'  // 좌우 벽
        return 'empty'
      })
    )

    return {
      roomId: room.id,
      tileWidth,
      tileHeight,
      gridSize: 16,
      layers: [
        { id: 'layer_base', name: 'Base', type: 'tile', visible: true, opacity: 1, tiles },
        { id: 'layer_objects', name: 'Objects', type: 'object', visible: true, opacity: 1, objects: [] }
      ]
    }
  }, [])

  // 초기 상세맵 (히스토리용)
  const initialDetail = useMemo(() => {
    if (!initialRoom) return null
    return initialRoom.detail || generateDefaultRoomDetail(initialRoom)
  }, [initialRoom, generateDefaultRoomDetail])

  // 히스토리 관리
  const {
    state: roomDetail,
    set: setRoomDetailHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory
  } = useHistory<RoomDetail | null>(initialDetail)

  // 방 설정
  const setEditingRoom = useCallback((room: Room | null) => {
    setEditingRoomState(room)
    if (room) {
      const detail = room.detail || generateDefaultRoomDetail(room)
      resetHistory(detail)
    } else {
      resetHistory(null)
    }
  }, [generateDefaultRoomDetail, resetHistory])

  // 상세맵 직접 설정
  const setRoomDetail = useCallback((detail: RoomDetail) => {
    setRoomDetailHistory(detail)
  }, [setRoomDetailHistory])

  // 타일 업데이트
  const updateTile = useCallback((x: number, y: number, tileType: TileType) => {
    if (!roomDetail) return
    if (y < 0 || y >= roomDetail.tileHeight || x < 0 || x >= roomDetail.tileWidth) return

    const layerIndex = roomDetail.layers.findIndex(l => l.id === activeLayerId && l.type === 'tile')
    if (layerIndex === -1) return
    const layer = roomDetail.layers[layerIndex]
    if (!layer.tiles) return
    if (layer.tiles[y][x] === tileType) return // 변경 없음

    const newTiles = layer.tiles.map(row => [...row])
    newTiles[y][x] = tileType

    const newLayers = [...roomDetail.layers]
    newLayers[layerIndex] = { ...layer, tiles: newTiles }

    setRoomDetailHistory({ ...roomDetail, layers: newLayers })
  }, [roomDetail, activeLayerId, setRoomDetailHistory])

  // 채우기 (Flood Fill)
  const fillTiles = useCallback((startX: number, startY: number, tileType: TileType) => {
    if (!roomDetail) return
    if (startY < 0 || startY >= roomDetail.tileHeight || startX < 0 || startX >= roomDetail.tileWidth) return

    const layerIndex = roomDetail.layers.findIndex(l => l.id === activeLayerId && l.type === 'tile')
    if (layerIndex === -1) return
    const layer = roomDetail.layers[layerIndex]
    if (!layer.tiles) return

    const originalType = layer.tiles[startY][startX]
    if (originalType === tileType) return // 같은 타입이면 무시

    const newTiles = layer.tiles.map(row => [...row])
    const stack: [number, number][] = [[startX, startY]]
    const visited = new Set<string>()

    while (stack.length > 0) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`

      if (visited.has(key)) continue
      if (x < 0 || x >= roomDetail.tileWidth || y < 0 || y >= roomDetail.tileHeight) continue
      if (newTiles[y][x] !== originalType) continue

      visited.add(key)
      newTiles[y][x] = tileType

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }

    const newLayers = [...roomDetail.layers]
    newLayers[layerIndex] = { ...layer, tiles: newTiles }

    setRoomDetailHistory({ ...roomDetail, layers: newLayers })
  }, [roomDetail, activeLayerId, setRoomDetailHistory])

  // 오브젝트 배치
  const placeObject = useCallback((x: number, y: number, objectType: ObjectType) => {
    if (!roomDetail) return

    let layerIndex = roomDetail.layers.findIndex(l => l.id === activeLayerId && l.type === 'object')
    if (layerIndex === -1) {
      // 오브젝트 레이어가 활성화되지 않았으면 첫번째 오브젝트 레이어를 찾음
      layerIndex = roomDetail.layers.findIndex(l => l.type === 'object')
    }
    if (layerIndex === -1) return

    const layer = roomDetail.layers[layerIndex]
    const objects = layer.objects || []

    // 같은 위치에 같은 타입 있으면 무시
    const exists = objects.find(
      obj => obj.x === x && obj.y === y && obj.type === objectType
    )
    if (exists) return

    const newObject: RoomObject = {
      id: `obj_${Date.now()}_${x}_${y}`,
      type: objectType,
      x,
      y
    }

    const newLayers = [...roomDetail.layers]
    newLayers[layerIndex] = { ...layer, objects: [...objects, newObject] }

    setRoomDetailHistory({ ...roomDetail, layers: newLayers })
  }, [roomDetail, activeLayerId, setRoomDetailHistory])

  // 오브젝트 삭제
  const deleteObject = useCallback((objectId: string) => {
    if (!roomDetail) return

    const newLayers = roomDetail.layers.map(layer => {
      if (layer.type === 'object' && layer.objects) {
        return { ...layer, objects: layer.objects.filter(obj => obj.id !== objectId) }
      }
      return layer
    })

    setRoomDetailHistory({ ...roomDetail, layers: newLayers })
  }, [roomDetail, setRoomDetailHistory])

  // 오브젝트 이동
  const moveObject = useCallback((objectId: string, newX: number, newY: number) => {
    if (!roomDetail) return

    const newLayers = roomDetail.layers.map(layer => {
      if (layer.type === 'object' && layer.objects) {
        return {
          ...layer,
          objects: layer.objects.map(obj =>
            obj.id === objectId ? { ...obj, x: newX, y: newY } : obj
          )
        }
      }
      return layer
    })

    setRoomDetailHistory({ ...roomDetail, layers: newLayers })
  }, [roomDetail, setRoomDetailHistory])

  // 초기화
  const resetRoomDetail = useCallback(() => {
    if (editingRoom) {
      const defaultDetail = generateDefaultRoomDetail(editingRoom)
      setRoomDetailHistory(defaultDetail)
    }
  }, [editingRoom, generateDefaultRoomDetail, setRoomDetailHistory])

  // AI 프롬프트로 상세맵 생성
  const generateFromPrompt = useCallback(async (prompt: string) => {
    if (!editingRoom || !roomDetail) return

    try {
      const response = await fetch(`${API_URL}/generate/room-detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          room_type: editingRoom.type,
          width: roomDetail.tileWidth,
          height: roomDetail.tileHeight
        })
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      // API 응답을 RoomDetail로 변환
      let newLayers = [...roomDetail.layers]

      const baseLayerIndex = newLayers.findIndex(l => l.name === 'Base' && l.type === 'tile')
      if (baseLayerIndex !== -1 && data.tiles) {
        newLayers[baseLayerIndex] = { ...newLayers[baseLayerIndex], tiles: data.tiles }
      }

      const objLayerIndex = newLayers.findIndex(l => l.name === 'Objects' && l.type === 'object')
      if (objLayerIndex !== -1 && data.objects) {
        newLayers[objLayerIndex] = { ...newLayers[objLayerIndex], objects: data.objects }
      }

      const newDetail: RoomDetail = {
        roomId: editingRoom.id,
        tileWidth: roomDetail.tileWidth,
        tileHeight: roomDetail.tileHeight,
        gridSize: roomDetail.gridSize,
        layers: newLayers
      }

      setRoomDetailHistory(newDetail)
    } catch (err) {
      console.error('Failed to generate room from prompt:', err)
      throw err
    }
  }, [editingRoom, roomDetail, setRoomDetailHistory])

  return {
    editingRoom,
    roomDetail,
    activeLayerId,
    selectedTile,
    selectedObject,
    currentTool,
    canUndo,
    canRedo,
    undo,
    redo,
    setEditingRoom,
    setActiveLayerId,
    setSelectedTile,
    setSelectedObject,
    setCurrentTool,
    updateTile,
    fillTiles,
    placeObject,
    deleteObject,
    moveObject,
    resetRoomDetail,
    setRoomDetail,
    generateFromPrompt
  }
}



