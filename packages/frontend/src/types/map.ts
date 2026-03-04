// Map data types based on API response

// ============================================
// Room Detail Editor Types (상세맵 편집)
// ============================================

// 타일 타입 (지형)
// NOTE:
// - 기본 타일은 아래 BUILTIN_TILE_TYPES로 정의됩니다.
// - 사용자 커스텀 타일(추가 타일)은 문자열 키로 확장 가능합니다.
export const BUILTIN_TILE_TYPES = ['empty', 'solid', 'platform', 'spike', 'acid', 'breakable', 'door'] as const
export type BuiltInTileType = (typeof BUILTIN_TILE_TYPES)[number]
export type TileType = string

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

// Unity Component Mapping Schema
export interface UnityComponentDefinition {
  type: string
  properties?: Record<string, any>
}

export interface UnityTagMapping {
  layer?: string
  tag?: string
  components: UnityComponentDefinition[]
}

// Built-in mapping for Unity export based on semantic tags
export const UNITY_COMPONENT_MAP: Record<string, UnityTagMapping> = {
  'Hazard': {
    layer: 'Enemy',
    tag: 'Hazard',
    components: [
      { type: 'BoxCollider2D', properties: { isTrigger: true } },
      { type: 'HazardLogic', properties: { damage: 10 } }
    ]
  },
  'Platform': {
    layer: 'Platform',
    tag: 'Untagged',
    components: [
      { type: 'BoxCollider2D', properties: { usedByEffector: true } },
      { type: 'PlatformEffector2D', properties: { useOneWay: true } }
    ]
  },
  'Portal': {
    layer: 'Interactable',
    tag: 'Portal',
    components: [
      { type: 'BoxCollider2D', properties: { isTrigger: true } },
      { type: 'PortalLogic', properties: { targetRoomId: 0 } }
    ]
  }
}

// 방 내부 오브젝트
export interface RoomObject {
  id: string
  type: ObjectType
  x: number  // 타일 좌표
  y: number
  tags?: string[]
  tagData?: Record<string, Record<string, unknown>>
  properties?: Record<string, unknown> // legacy
}

export type LayerType = 'tile' | 'object' | 'image'

export interface RoomLayer {
  id: string
  name: string
  type: LayerType
  visible: boolean
  opacity: number
  tiles?: TileType[][] // For tile layers
  objects?: RoomObject[] // For object layers
  imageUrl?: string // For image layers
  imageScale?: number
  imageOffsetX?: number
  imageOffsetY?: number
}

// 방 상세 데이터
export interface RoomDetail {
  roomId: number
  tileWidth: number   // 타일 단위 너비 (예: 40)
  tileHeight: number  // 타일 단위 높이 (예: 23)
  gridSize?: number   // 기본 16
  layers: RoomLayer[]
  tiles?: TileType[][] // legacy
  objects?: RoomObject[] // legacy
}

// 타일 아이콘 매핑 (레거시: UI에서 아이콘을 제거하는 방향이므로 의존 최소화)
export const TILE_ICONS: Record<string, string> = {
  empty: '⬜',
  solid: '⬛',
  platform: '▫️',
  spike: '🔺',
  acid: '💚',
  breakable: '🧱',
  door: '🚪'
}

// 타일 색상 매핑
export const TILE_COLORS: Record<string, string> = {
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

