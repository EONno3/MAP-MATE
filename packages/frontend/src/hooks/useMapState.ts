import { useState, useCallback } from 'react'
import { MapData, Room, Connection, GateCondition, Zone } from '../types/map'
import { useHistory } from './useHistory'

// API URL: 환경변수가 없으면 현재 origin 사용 (Docker nginx 프록시용)
const API_URL = import.meta.env.VITE_API_URL || ''

// 히스토리에 저장할 맵 상태
interface MapHistoryState {
  mapData: MapData | null
  connections: Connection[]
}

// 선택된 연결선 타입
interface SelectedConnection {
  fromId: number
  toId: number
}

// 맵 생성 파라미터 (fetchMap용)
interface FetchMapParams {
  seed?: number | null
  zoneCount?: number
  zoneSize?: 'small' | 'medium' | 'large'
  gateDensity?: 'low' | 'medium' | 'high'
}

interface UseMapStateReturn {
  mapData: MapData | null
  loading: boolean
  error: string | null
  selectedRoomId: number | null
  selectedRoomIds: number[]  // 다중 선택
  hoveredRoomId: number | null
  connections: Connection[]
  selectedConnection: SelectedConnection | null
  clipboard: Room[]  // 복사된 방들
  mapVersion: number  // 새 맵 생성 시 증가
  
  // History
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  
  // Actions
  fetchMap: (params?: FetchMapParams) => Promise<void>
  fetchMapFromPrompt: (prompt: string) => Promise<void>
  setSelectedRoom: (id: number | null) => void
  setHoveredRoom: (id: number | null) => void
  updateRoom: (id: number, updates: Partial<Room>, recordHistory?: boolean) => void
  addRoom: (room: Room) => void
  deleteRoom: (id: number) => void
  addConnection: (fromId: number, toId: number, condition?: GateCondition) => void
  deleteConnection: (fromId: number, toId: number) => void
  updateConnection: (fromId: number, toId: number, condition: GateCondition) => void
  setSelectedConnection: (conn: SelectedConnection | null) => void
  setMapData: (data: MapData | null) => void
  
  // Zone CRUD
  addZone: (zone: Zone) => number
  updateZone: (id: number, updates: Partial<Zone>) => void
  deleteZone: (id: number) => void
  
  // Room operations
  splitRoom: (id: number) => void  // 복합 방을 분리
  
  // 다중 선택
  toggleRoomSelection: (id: number) => void
  setSelectedRooms: (ids: number[]) => void
  clearSelection: () => void
  selectAllRooms: () => void
  updateSelectedRooms: (updates: Partial<Room>) => void
  deleteSelectedRooms: () => void
  
  // 복사/붙여넣기
  copySelectedRooms: () => void
  pasteRooms: () => void
}

export function useMapState(): UseMapStateReturn {
  // 히스토리 관리
  const {
    state: historyState,
    set: setHistoryState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear: clearHistory
  } = useHistory<MapHistoryState>({ mapData: null, connections: [] })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([])  // 다중 선택
  const [hoveredRoomId, setHoveredRoomId] = useState<number | null>(null)
  const [selectedConnection, setSelectedConnectionState] = useState<SelectedConnection | null>(null)
  const [clipboard, setClipboard] = useState<Room[]>([])  // 복사된 방들
  const [mapVersion, setMapVersion] = useState(0)  // 새 맵 생성 시 증가

  // 히스토리에서 현재 상태 추출
  const mapData = historyState.mapData
  const connections = historyState.connections

  // 맵 데이터 설정 (히스토리 기록)
  const setMapData = useCallback((data: MapData | null) => {
    setHistoryState({ mapData: data, connections: historyState.connections })
  }, [setHistoryState, historyState.connections])

  // 연결 설정 (내부용)
  const setConnections = useCallback((newConnections: Connection[]) => {
    setHistoryState({ mapData: historyState.mapData, connections: newConnections })
  }, [setHistoryState, historyState.mapData])

  // Build connections from room data
  const buildConnections = useCallback((data: MapData): Connection[] => {
    const newConnections: Connection[] = []
    const processedPairs = new Set<string>()
    
    data.rooms.forEach((room: Room) => {
      room.neighbors?.forEach((neighborId: number) => {
        const pairKey = [room.id, neighborId].sort().join('-')
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey)
          newConnections.push({
            fromId: room.id,
            toId: neighborId,
            condition: 'none'
          })
        }
      })
    })
    
    return newConnections
  }, [])

  // Fetch map from API
  const fetchMap = useCallback(async (params?: FetchMapParams) => {
    setLoading(true)
    setError(null)
    
    try {
      // URL 쿼리 파라미터 구성
      const queryParams = new URLSearchParams()
      
      if (params?.seed !== undefined && params?.seed !== null) {
        queryParams.set('seed', params.seed.toString())
      }
      if (params?.zoneCount !== undefined) {
        queryParams.set('zone_count', params.zoneCount.toString())
      }
      if (params?.zoneSize !== undefined) {
        queryParams.set('zone_size', params.zoneSize)
      }
      if (params?.gateDensity !== undefined) {
        queryParams.set('gate_density', params.gateDensity)
      }
      
      const queryString = queryParams.toString()
      const url = queryString ? `${API_URL}/generate?${queryString}` : `${API_URL}/generate`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      const newConnections = buildConnections(data)
      
      // 새 맵 로드시 히스토리 초기화하고 새 상태 설정
      clearHistory()
      setHistoryState({ mapData: data, connections: newConnections }, false)
      setSelectedRoomId(null)
      setSelectedRoomIds([])
      setMapVersion(v => v + 1)  // fitToView 트리거
      
    } catch (err: any) {
      console.error('Failed to fetch map:', err)
      setError(err.message || 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }, [buildConnections, clearHistory, setHistoryState])

  // Fetch map from AI prompt
  const fetchMapFromPrompt = useCallback(async (prompt: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_URL}/generate/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      const data = await response.json()
      const newConnections = buildConnections(data)
      
      clearHistory()
      setHistoryState({ mapData: data, connections: newConnections }, false)
      setSelectedRoomId(null)
      setSelectedRoomIds([])
      setMapVersion(v => v + 1)  // fitToView 트리거
      
    } catch (err: any) {
      console.error('Failed to fetch map from prompt:', err)
      setError(err.message || 'Failed to generate map from prompt')
    } finally {
      setLoading(false)
    }
  }, [buildConnections, clearHistory, setHistoryState])

  // Select a room
  const setSelectedRoom = useCallback((id: number | null) => {
    setSelectedRoomId(id)
  }, [])

  // Hover a room
  const setHoveredRoom = useCallback((id: number | null) => {
    setHoveredRoomId(id)
  }, [])

  // Update a room's properties
  const updateRoom = useCallback((id: number, updates: Partial<Room>, recordHistory: boolean = true) => {
    if (!mapData) return
    
    const newMapData = {
      ...mapData,
      rooms: mapData.rooms.map(room => 
        room.id === id ? { ...room, ...updates } : room
      )
    }
    
    setHistoryState({ mapData: newMapData, connections }, recordHistory)
  }, [mapData, connections, setHistoryState])

  // Add a new room
  const addRoom = useCallback((room: Room) => {
    if (!mapData) return
    
    const newMapData = {
      ...mapData,
      rooms: [...mapData.rooms, room]
    }
    
    setHistoryState({ mapData: newMapData, connections })
  }, [mapData, connections, setHistoryState])

  // Delete a room
  const deleteRoom = useCallback((id: number) => {
    if (!mapData) return
    
    const newMapData = {
      ...mapData,
      rooms: mapData.rooms.filter(room => room.id !== id)
    }
    
    const newConnections = connections.filter(
      conn => conn.fromId !== id && conn.toId !== id
    )
    
    setHistoryState({ mapData: newMapData, connections: newConnections })
    
    if (selectedRoomId === id) {
      setSelectedRoomId(null)
    }
  }, [mapData, connections, selectedRoomId, setHistoryState])

  // Add a connection between rooms
  const addConnection = useCallback((fromId: number, toId: number, condition: GateCondition = 'none') => {
    // Check if connection already exists
    const exists = connections.some(
      conn => (conn.fromId === fromId && conn.toId === toId) ||
              (conn.fromId === toId && conn.toId === fromId)
    )
    
    if (exists) return
    
    const newConnections = [...connections, { fromId, toId, condition }]
    setHistoryState({ mapData, connections: newConnections })
  }, [mapData, connections, setHistoryState])

  // Delete a connection
  const deleteConnection = useCallback((fromId: number, toId: number) => {
    const newConnections = connections.filter(
      conn => !((conn.fromId === fromId && conn.toId === toId) ||
                (conn.fromId === toId && conn.toId === fromId))
    )
    setHistoryState({ mapData, connections: newConnections })
    // 삭제된 연결이 선택된 상태였다면 선택 해제
    if (selectedConnection && 
        ((selectedConnection.fromId === fromId && selectedConnection.toId === toId) ||
         (selectedConnection.fromId === toId && selectedConnection.toId === fromId))) {
      setSelectedConnectionState(null)
    }
  }, [mapData, connections, selectedConnection, setHistoryState])

  // Update a connection's condition
  const updateConnection = useCallback((fromId: number, toId: number, condition: GateCondition) => {
    const newConnections = connections.map(conn => {
      if ((conn.fromId === fromId && conn.toId === toId) ||
          (conn.fromId === toId && conn.toId === fromId)) {
        return { ...conn, condition }
      }
      return conn
    })
    setHistoryState({ mapData, connections: newConnections })
  }, [mapData, connections, setHistoryState])

  // Set selected connection
  const setSelectedConnection = useCallback((conn: SelectedConnection | null) => {
    setSelectedConnectionState(conn)
    // 연결선 선택 시 방 선택 해제
    if (conn) {
      setSelectedRoomId(null)
    }
  }, [])

  // Add a new zone
  const addZone = useCallback((zone: Zone): number => {
    if (!mapData) return 0
    
    // Find next available zone ID
    const existingIds = Object.keys(mapData.zones).map(Number)
    const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
    
    const newMapData = {
      ...mapData,
      zones: {
        ...mapData.zones,
        [newId]: zone
      }
    }
    
    setHistoryState({ mapData: newMapData, connections })
    return newId
  }, [mapData, connections, setHistoryState])

  // Update a zone
  const updateZone = useCallback((id: number, updates: Partial<Zone>) => {
    if (!mapData || !mapData.zones[id]) return
    
    const newMapData = {
      ...mapData,
      zones: {
        ...mapData.zones,
        [id]: { ...mapData.zones[id], ...updates }
      }
    }
    
    setHistoryState({ mapData: newMapData, connections })
  }, [mapData, connections, setHistoryState])

  // Delete a zone (moves all rooms to zone 1)
  const deleteZone = useCallback((id: number) => {
    if (!mapData) return
    
    const zoneIds = Object.keys(mapData.zones).map(Number)
    if (zoneIds.length <= 1) return // Cannot delete last zone
    
    // Find a fallback zone ID (first zone that's not being deleted)
    const fallbackId = zoneIds.find(zId => zId !== id) || 1
    
    // Remove zone and update rooms
    const { [id]: _removedZone, ...remainingZones } = mapData.zones
    const updatedRooms = mapData.rooms.map(room => 
      room.zone_id === id ? { ...room, zone_id: fallbackId } : room
    )
    
    const newMapData = {
      ...mapData,
      zones: remainingZones,
      rooms: updatedRooms
    }
    
    setHistoryState({ mapData: newMapData, connections })
  }, [mapData, connections, setHistoryState])

  // Split a room with multiple rects into separate rooms
  const splitRoom = useCallback((id: number) => {
    if (!mapData) return
    
    const room = mapData.rooms.find(r => r.id === id)
    if (!room || !room.rects || room.rects.length <= 1) return // Nothing to split
    
    // Get max room ID
    const maxId = Math.max(...mapData.rooms.map(r => r.id), 0)
    
    // Create new rooms from each rect
    const newRooms: Room[] = []
    const originalConnections = connections.filter(
      c => c.fromId === id || c.toId === id
    )
    const otherConnections = connections.filter(
      c => c.fromId !== id && c.toId !== id
    )
    
    room.rects.forEach((rect, index) => {
      const [rx, ry, rw, rh] = rect
      const newRoom: Room = {
        id: index === 0 ? room.id : maxId + index, // 첫 번째는 원본 ID 유지
        x: room.x + rx,
        y: room.y + ry,
        w: rw,
        h: rh,
        zone_id: room.zone_id,
        type: index === 0 ? room.type : 'normal', // 첫 번째만 원본 타입 유지
        rects: [[0, 0, rw, rh]], // 단일 rect로 변환
        neighbors: [],
        name: index === 0 ? room.name : undefined,
        depth: room.depth,
        detail: index === 0 ? room.detail : undefined // 첫 번째만 상세맵 유지
      }
      newRooms.push(newRoom)
    })
    
    // 인접한 새 방들끼리 연결 추가
    const newConnections: Connection[] = [...otherConnections]
    
    // 원본 연결을 첫 번째 방에 연결
    originalConnections.forEach(conn => {
      if (conn.fromId === id) {
        newConnections.push({ ...conn, fromId: newRooms[0].id })
      } else if (conn.toId === id) {
        newConnections.push({ ...conn, toId: newRooms[0].id })
      }
    })
    
    // 새 방들끼리 연결 (인접 체크)
    for (let i = 0; i < newRooms.length; i++) {
      for (let j = i + 1; j < newRooms.length; j++) {
        const r1 = newRooms[i]
        const r2 = newRooms[j]
        
        // 인접 체크 (1칸 이내)
        const isAdjacent = 
          (Math.abs(r1.x + r1.w - r2.x) <= 1 || Math.abs(r2.x + r2.w - r1.x) <= 1) &&
          !(r1.y + r1.h < r2.y || r2.y + r2.h < r1.y) ||
          (Math.abs(r1.y + r1.h - r2.y) <= 1 || Math.abs(r2.y + r2.h - r1.y) <= 1) &&
          !(r1.x + r1.w < r2.x || r2.x + r2.w < r1.x)
        
        if (isAdjacent) {
          newConnections.push({
            fromId: r1.id,
            toId: r2.id,
            condition: 'none'
          })
        }
      }
    }
    
    // 기존 방 제거하고 새 방들 추가
    const updatedRooms = mapData.rooms.filter(r => r.id !== id).concat(newRooms)
    
    const newMapData = {
      ...mapData,
      rooms: updatedRooms
    }
    
    setHistoryState({ mapData: newMapData, connections: newConnections })
    setSelectedRoomId(newRooms[0].id)
  }, [mapData, connections, setHistoryState])

  // ===== 다중 선택 함수들 =====
  
  // 다중 선택 토글 (Ctrl+클릭)
  const toggleRoomSelection = useCallback((id: number) => {
    setSelectedRoomIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(rid => rid !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  // 선택된 방들 설정
  const setSelectedRooms = useCallback((ids: number[]) => {
    setSelectedRoomIds(ids)
  }, [])

  // 모든 선택 해제
  const clearSelection = useCallback(() => {
    setSelectedRoomId(null)
    setSelectedRoomIds([])
    setSelectedConnectionState(null)
  }, [])

  // 모든 방 선택 (Ctrl+A)
  const selectAllRooms = useCallback(() => {
    if (!mapData) return
    setSelectedRoomIds(mapData.rooms.map(r => r.id))
    setSelectedRoomId(null)
  }, [mapData])

  // 선택된 방들 일괄 업데이트
  const updateSelectedRooms = useCallback((updates: Partial<Room>) => {
    if (!mapData) return
    
    // 단일 선택과 다중 선택 모두 처리
    const targetIds = selectedRoomIds.length > 0 
      ? selectedRoomIds 
      : (selectedRoomId !== null ? [selectedRoomId] : [])
    
    if (targetIds.length === 0) return
    
    const newMapData = {
      ...mapData,
      rooms: mapData.rooms.map(room => 
        targetIds.includes(room.id) ? { ...room, ...updates } : room
      )
    }
    
    setHistoryState({ mapData: newMapData, connections })
  }, [mapData, connections, selectedRoomIds, selectedRoomId, setHistoryState])

  // 선택된 방들 일괄 삭제
  const deleteSelectedRooms = useCallback(() => {
    if (!mapData) return
    
    const targetIds = selectedRoomIds.length > 0 
      ? selectedRoomIds 
      : (selectedRoomId !== null ? [selectedRoomId] : [])
    
    if (targetIds.length === 0) return
    
    const newMapData = {
      ...mapData,
      rooms: mapData.rooms.filter(room => !targetIds.includes(room.id))
    }
    
    const newConnections = connections.filter(
      conn => !targetIds.includes(conn.fromId) && !targetIds.includes(conn.toId)
    )
    
    setHistoryState({ mapData: newMapData, connections: newConnections })
    setSelectedRoomId(null)
    setSelectedRoomIds([])
  }, [mapData, connections, selectedRoomIds, selectedRoomId, setHistoryState])

  // ===== 복사/붙여넣기 함수들 =====
  
  // 선택된 방들 복사 (Ctrl+C)
  const copySelectedRooms = useCallback(() => {
    if (!mapData) return
    
    const targetIds = selectedRoomIds.length > 0 
      ? selectedRoomIds 
      : (selectedRoomId !== null ? [selectedRoomId] : [])
    
    if (targetIds.length === 0) return
    
    const roomsToCopy = mapData.rooms.filter(room => targetIds.includes(room.id))
    setClipboard(roomsToCopy)
  }, [mapData, selectedRoomIds, selectedRoomId])

  // 복사된 방들 붙여넣기 (Ctrl+V)
  const pasteRooms = useCallback(() => {
    if (!mapData || clipboard.length === 0) return
    
    // 현재 최대 ID 찾기
    const maxId = Math.max(...mapData.rooms.map(r => r.id), 0)
    
    // 복사된 방들의 바운딩 박스 계산
    const minX = Math.min(...clipboard.map(r => r.x))
    const minY = Math.min(...clipboard.map(r => r.y))
    
    // 오프셋 (기존 방과 겹치지 않도록)
    const offsetX = 2
    const offsetY = 2
    
    // 새 방들 생성 (ID와 위치 변경)
    const newRooms: Room[] = clipboard.map((room, index) => ({
      ...room,
      id: maxId + 1 + index,
      x: room.x - minX + offsetX,
      y: room.y - minY + offsetY,
      detail: room.detail ? { ...room.detail, roomId: maxId + 1 + index } : undefined
    }))
    
    const newMapData = {
      ...mapData,
      rooms: [...mapData.rooms, ...newRooms]
    }
    
    setHistoryState({ mapData: newMapData, connections })
    
    // 붙여넣은 방들 선택
    setSelectedRoomIds(newRooms.map(r => r.id))
    setSelectedRoomId(null)
  }, [mapData, clipboard, connections, setHistoryState])

  return {
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
    // 다중 선택
    toggleRoomSelection,
    setSelectedRooms,
    clearSelection,
    selectAllRooms,
    updateSelectedRooms,
    deleteSelectedRooms,
    // 복사/붙여넣기
    copySelectedRooms,
    pasteRooms
  }
}

