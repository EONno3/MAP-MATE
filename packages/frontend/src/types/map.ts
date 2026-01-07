// Map data types based on API response

// ============================================
// Room Detail Editor Types (상세맵 편집)
// ============================================

// 타일 타입 (지형)
export type TileType = 
  | 'empty'      // 빈 공간 (통과 가능)
  | 'solid'      // 벽/바닥 (통과 불가)
  | 'platform'   // 플랫폼 (위에서 착지, 아래로 통과)
  | 'spike'      // 가시 (데미지)
  | 'acid'       // 산성 (데미지, 수영 필요)
  | 'breakable'  // 부서지는 벽
  | 'door'       // 문 (조건부 통과)

// 오브젝트 타입
export type ObjectType =
  | 'spawn_point'    // 플레이어 스폰
  | 'enemy_spawn'    // 적 스폰
  | 'item'           // 아이템
  | 'chest'          // 보물상자
  | 'switch'         // 스위치
  | 'npc'            // NPC
  | 'save_point'     // 세이브 포인트
  | 'transition'     // 방 전환 포인트

// 방 내부 오브젝트
export interface RoomObject {
  id: string
  type: ObjectType
  x: number  // 타일 좌표
  y: number
  properties?: Record<string, unknown>
}

// 방 상세 데이터
export interface RoomDetail {
  roomId: number
  tileWidth: number   // 타일 단위 너비 (예: 40)
  tileHeight: number  // 타일 단위 높이 (예: 23)
  tiles: TileType[][] // 2D 타일 배열 [y][x]
  objects: RoomObject[]
}

// 타일 아이콘 매핑
export const TILE_ICONS: Record<TileType, string> = {
  empty: '⬜',
  solid: '⬛',
  platform: '▫️',
  spike: '🔺',
  acid: '💚',
  breakable: '🧱',
  door: '🚪'
}

// 타일 색상 매핑
export const TILE_COLORS: Record<TileType, string> = {
  empty: 'transparent',
  solid: '#444444',
  platform: '#8B4513',
  spike: '#ff4444',
  acid: '#00ff00',
  breakable: '#8B7355',
  door: '#4a90d9'
}

// 오브젝트 아이콘 매핑
export const OBJECT_ICONS: Record<ObjectType, string> = {
  spawn_point: '🏠',
  enemy_spawn: '👾',
  item: '⭐',
  chest: '📦',
  switch: '🔘',
  npc: '🧑',
  save_point: '💾',
  transition: '➡️'
}

// 상수
export const TILES_PER_CHUNK_X = 10  // 청크당 가로 타일 수
export const TILES_PER_CHUNK_Y = 6   // 청크당 세로 타일 수
export const TILE_SIZE = 16          // 타일 픽셀 크기

// ============================================
// Room Types
// ============================================

export interface Room {
  id: number
  x: number
  y: number
  w: number
  h: number
  zone_id: number
  type: RoomType
  rects: [number, number, number, number][] // [rx, ry, rw, rh][]
  neighbors: number[]
  name?: string
  depth?: number
  detail?: RoomDetail  // 상세맵 데이터 (선택적)
}

export type RoomType = 
  | 'start'
  | 'hub'
  | 'normal'
  | 'boss'
  | 'item'
  | 'save'
  | 'shop'
  | 'stag'
  | 'map'

export interface Zone {
  name: string
  color: string
}

export interface Connection {
  fromId: number
  toId: number
  condition: GateCondition
}

export type GateCondition = 
  | 'none'
  | 'dash'
  | 'wall_jump'
  | 'double_jump'
  | 'super_dash'
  | 'swim'
  | 'lantern'
  | 'desolate_dive'
  | 'simple_key'
  | 'city_crest'
  | 'tram_pass'
  | 'event_lock'

export interface MapData {
  width: number
  height: number
  rooms: Room[]
  zones: Record<number, Zone>
  connections?: Connection[]
}

export interface CanvasTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface Point {
  x: number
  y: number
}

// Editor tool types
export type EditorTool = 'select' | 'pan' | 'connect' | 'add_room' | 'delete' | 'draw'

// Room type icons mapping
export const ROOM_TYPE_ICONS: Record<RoomType, string> = {
  start: '🏠',
  hub: '🏛️',
  normal: '',
  boss: '💀',
  item: '📦',
  save: '💾',
  shop: '🛒',
  stag: '🚉',
  map: '🗺️'
}

// Gate condition colors
export const GATE_COLORS: Record<GateCondition, string> = {
  none: '#666666',
  dash: '#00ff00',
  wall_jump: '#ff9900',
  double_jump: '#ff00ff',
  super_dash: '#00ffff',
  swim: '#0066ff',
  lantern: '#ffff00',
  desolate_dive: '#ff0066',
  simple_key: '#cccccc',
  city_crest: '#9966ff',
  tram_pass: '#996633',
  event_lock: '#ff0000'
}

