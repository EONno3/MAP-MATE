export type Language = 'ko' | 'en'

export interface Translations {
  // App
  appName: string
  generating: string
  generatingDescription: string

  // Toolbar
  generate: string
  exportJson: string
  exportUnity: string
  importJson: string
  rooms: string
  undo: string
  redo: string

  // Tools
  toolSelect: string
  toolDraw: string
  toolConnect: string
  toolDelete: string
  drawing: string

  // AI Prompt
  aiPrompt: string
  aiPromptPlaceholder: string
  generateFromPrompt: string
  aiGenerating: string

  // ParamPanel
  parameters: string
  seedOptional: string
  random: string
  zoneCount: string
  zoneSize: string
  small: string
  medium: string
  large: string
  gateDensity: string
  low: string
  high: string
  generateMap: string
  tipSeed: string

  // Sidebar
  clickToEdit: string
  roomType: string
  zone: string
  position: string
  size: string
  width: string
  height: string
  depthFromStart: string
  steps: string
  connections: string
  neighbors: string
  deleteRoom: string
  editDetail: string

  // Room Types
  roomTypeStart: string
  roomTypeHub: string
  roomTypeNormal: string
  roomTypeBoss: string
  roomTypeItem: string
  roomTypeSave: string
  roomTypeShop: string
  roomTypeStag: string
  roomTypeMap: string

  // MapCanvas
  zoom: string
  dragging: string
  clickToConnect: string
  instructions: string

  // Tooltip
  room: string
  type: string
  depth: string

  // Errors
  error: string
  retry: string
  failedToImport: string
  invalidMapFormat: string
  mapEmptyTitle: string
  mapEmptyDescription: string
  mapErrorDescription: string

  // Room Editor
  backToWorldMap: string
  tiles: string
  save: string
  reset: string
  tileBrush: string
  objects: string
  currentTool: string
  tileMode: string
  objectMode: string
  cancelSelection: string
  unsavedChanges: string
  unsavedChangesIndicator: string
  confirmReset: string
  roomEditorInstructions: string
  objectDragHint: string
  toolType: string
  brushTool: string
  fillTool: string
  brushSize: string

  // Tiles
  tileEmpty: string
  tileSolid: string
  tilePlatform: string
  tileSpike: string
  tileAcid: string
  tileBreakable: string
  tileDoor: string

  // Objects
  objectSpawnPoint: string
  objectEnemySpawn: string
  objectItem: string
  objectChest: string
  objectSwitch: string
  objectNpc: string
  objectSavePoint: string
  objectTransition: string

  // Zone Management
  zoneManagement: string
  addZone: string
  deleteZone: string
  zoneName: string
  zoneColor: string
  confirmDeleteZone: string
  cannotDeleteLastZone: string
  assignZone: string
  newZone: string

  // Connection Editing
  connectionSelected: string
  connectionCondition: string
  deleteConnection: string
  clickConnectionToEdit: string

  // Room Operations
  splitRoom: string
  splitRoomHint: string
  cannotSplit: string

  // Multi-selection
  multipleRoomsSelected: string
  batchZoneChange: string
  batchTypeChange: string
  selectedRoomsList: string
  deleteSelectedRooms: string
  copy: string
  paste: string
  mixed: string
  selectType: string
}

export const translations: Record<Language, Translations> = {
  ko: {
    // App
    appName: 'Mapmate',
    generating: '맵 생성 중...',
    generatingDescription: '방, 연결선, POI를 생성하고 있습니다',

    // Toolbar
    generate: '생성',
    exportJson: 'JSON 내보내기',
    exportUnity: 'Unity 내보내기',
    importJson: 'JSON 가져오기',
    rooms: '방',
    undo: '실행취소',
    redo: '다시실행',

    // Tools
    toolSelect: '선택',
    toolDraw: '방 그리기',
    toolConnect: '연결',
    toolDelete: '삭제',
    drawing: '드래그하여 방 생성...',

    // AI Prompt
    aiPrompt: 'AI 프롬프트',
    aiPromptPlaceholder: '예: 고층 건물이 있는 사이버펑크 도시...',
    generateFromPrompt: 'AI 생성',
    aiGenerating: 'AI 생성 중...',

    // ParamPanel
    parameters: '생성 파라미터',
    seedOptional: '시드값 (선택)',
    random: '랜덤',
    zoneCount: '구역 수',
    zoneSize: '구역 크기',
    small: '작음',
    medium: '보통',
    large: '큼',
    gateDensity: '게이트 밀도',
    low: '낮음',
    high: '높음',
    generateMap: '맵 생성',
    tipSeed: '💡 팁: 시드를 비워두면 랜덤 생성됩니다. 같은 시드 + 설정 = 같은 맵',

    // Sidebar
    clickToEdit: '방을 클릭하여 편집하세요',
    roomType: '방 유형',
    zone: '구역',
    position: '위치',
    size: '크기',
    width: '너비',
    height: '높이',
    depthFromStart: '시작점으로부터 거리',
    steps: '단계',
    connections: '연결',
    neighbors: '개 연결됨',
    deleteRoom: '방 삭제',
    editDetail: '상세맵 편집',

    // Room Types
    roomTypeStart: '시작',
    roomTypeHub: '허브',
    roomTypeNormal: '일반',
    roomTypeBoss: '보스',
    roomTypeItem: '아이템',
    roomTypeSave: '세이브',
    roomTypeShop: '상점',
    roomTypeStag: '이동',
    roomTypeMap: '지도',

    // MapCanvas
    zoom: '줌',
    dragging: '이동 중...',
    clickToConnect: '다른 방을 클릭하여 연결',
    instructions: '스크롤: 줌 | Space+드래그: 이동 | 클릭: 방 메뉴 | 드래그: 방 이동 | Ctrl+클릭: 다중선택/연결 | 더블클릭: 상세맵 | Delete: 삭제',

    // Tooltip
    room: '방',
    type: '유형',
    depth: '깊이',

    // Errors
    error: '오류',
    retry: '다시 시도',
    failedToImport: '가져오기 실패',
    invalidMapFormat: '잘못된 맵 파일 형식입니다',
    mapEmptyTitle: '맵이 아직 없습니다',
    mapEmptyDescription: '새 맵을 생성하거나 JSON을 가져와 주세요',
    mapErrorDescription: '서버와 통신할 수 없습니다',

    // Room Editor
    backToWorldMap: '전체맵',
    tiles: '타일',
    save: '저장',
    reset: '초기화',
    tileBrush: '타일 브러시',
    objects: '오브젝트',
    currentTool: '현재 도구',
    tileMode: '타일 모드',
    objectMode: '오브젝트 모드',
    cancelSelection: '선택 해제',
    unsavedChanges: '저장하지 않은 변경사항이 있습니다. 나가시겠습니까?',
    unsavedChangesIndicator: '저장되지 않은 변경사항',
    confirmReset: '모든 변경사항을 초기화하시겠습니까?',
    roomEditorInstructions: '클릭/드래그: 그리기 | Space+드래그: 이동 | 단축키(B/G/E): 도구 변경 | 스크롤: 줌 | 오브젝트: 클릭 선택 후 드래그 | Delete: 삭제',
    objectDragHint: '오브젝트를 선택 후 드래그하여 이동',
    toolType: '도구 종류',
    brushTool: '브러시',
    fillTool: '채우기',
    brushSize: '브러시 크기',

    // Tiles
    tileEmpty: '빈 공간',
    tileSolid: '벽/바닥',
    tilePlatform: '플랫폼',
    tileSpike: '가시',
    tileAcid: '산성',
    tileBreakable: '부서지는 벽',
    tileDoor: '문',

    // Objects
    objectSpawnPoint: '스폰 지점',
    objectEnemySpawn: '적 스폰',
    objectItem: '아이템',
    objectChest: '보물상자',
    objectSwitch: '스위치',
    objectNpc: 'NPC',
    objectSavePoint: '세이브',
    objectTransition: '방 전환',

    // Zone Management
    zoneManagement: '구역 관리',
    addZone: '구역 추가',
    deleteZone: '구역 삭제',
    zoneName: '구역 이름',
    zoneColor: '구역 색상',
    confirmDeleteZone: '이 구역을 삭제하시겠습니까? 소속된 방들은 기본 구역으로 이동됩니다.',
    cannotDeleteLastZone: '마지막 구역은 삭제할 수 없습니다',
    assignZone: '구역 지정',
    newZone: '새 구역',

    // Connection Editing
    connectionSelected: '연결 선택됨',
    connectionCondition: '연결 조건',
    deleteConnection: '연결 삭제',
    clickConnectionToEdit: '연결선을 클릭하여 편집',

    // Room Operations
    splitRoom: '방 분리',
    splitRoomHint: '복합 방을 개별 방으로 분리',
    cannotSplit: '분리할 수 없음 (단일 블록)',

    // Multi-selection
    multipleRoomsSelected: '개 방 선택됨',
    batchZoneChange: '일괄 구역 변경',
    batchTypeChange: '일괄 유형 변경',
    selectedRoomsList: '선택된 방 목록',
    deleteSelectedRooms: '선택된 방 삭제',
    copy: '복사',
    paste: '붙여넣기',
    mixed: '혼합됨',
    selectType: '유형 선택'
  },

  en: {
    // App
    appName: 'Mapmate',
    generating: 'Generating Map...',
    generatingDescription: 'Creating rooms, connections, and POIs',

    // Toolbar
    generate: 'Generate',
    exportJson: 'Export JSON',
    exportUnity: 'Export for Unity',
    importJson: 'Import JSON',
    rooms: 'Rooms',
    undo: 'Undo',
    redo: 'Redo',

    // Tools
    toolSelect: 'Select',
    toolDraw: 'Draw Room',
    toolConnect: 'Connect',
    toolDelete: 'Delete',
    drawing: 'Drag to create room...',

    // AI Prompt
    aiPrompt: 'AI Prompt',
    aiPromptPlaceholder: 'e.g., A cyberpunk city with tall buildings...',
    generateFromPrompt: 'AI Generate',
    aiGenerating: 'AI Generating...',

    // ParamPanel
    parameters: 'Generation Parameters',
    seedOptional: 'Seed (Optional)',
    random: 'Random',
    zoneCount: 'Zone Count',
    zoneSize: 'Zone Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    gateDensity: 'Gate Density',
    low: 'Low',
    high: 'High',
    generateMap: 'Generate Map',
    tipSeed: '💡 Tip: Leave seed empty for random generation. Same seed + params = same map.',

    // Sidebar
    clickToEdit: 'Click on a room to edit',
    roomType: 'Room Type',
    zone: 'Zone',
    position: 'Position',
    size: 'Size',
    width: 'Width',
    height: 'Height',
    depthFromStart: 'Depth from Start',
    steps: 'steps',
    connections: 'Connections',
    neighbors: 'neighbors',
    deleteRoom: 'Delete Room',
    editDetail: 'Edit Detail',

    // Room Types
    roomTypeStart: 'Start',
    roomTypeHub: 'Hub',
    roomTypeNormal: 'Normal',
    roomTypeBoss: 'Boss',
    roomTypeItem: 'Item',
    roomTypeSave: 'Save',
    roomTypeShop: 'Shop',
    roomTypeStag: 'Stag',
    roomTypeMap: 'Map',

    // MapCanvas
    zoom: 'Zoom',
    dragging: 'Dragging...',
    clickToConnect: 'Click another room to connect',
    instructions: 'Scroll: Zoom | Space+Drag: Pan | Click: Menu | Drag: Move | Ctrl+Click: Connect | Double-click: Detail | Delete: Remove',

    // Tooltip
    room: 'Room',
    type: 'Type',
    depth: 'Depth',

    // Errors
    error: 'Error',
    retry: 'Retry',
    failedToImport: 'Failed to import',
    invalidMapFormat: 'Invalid map file format',
    mapEmptyTitle: 'No map yet',
    mapEmptyDescription: 'Generate a new map or import JSON to begin',
    mapErrorDescription: 'Unable to reach the server',

    // Room Editor
    backToWorldMap: 'World Map',
    tiles: 'tiles',
    save: 'Save',
    reset: 'Reset',
    tileBrush: 'Tile Brush',
    objects: 'Objects',
    currentTool: 'Current Tool',
    tileMode: 'Tile Mode',
    objectMode: 'Object Mode',
    cancelSelection: 'Cancel Selection',
    unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?',
    unsavedChangesIndicator: 'Unsaved changes',
    confirmReset: 'Reset all changes?',
    roomEditorInstructions: 'Click/Drag: Paint | Space+Drag: Pan | Keys(B/G/E): Tools | Scroll: Zoom | Delete: Remove',
    objectDragHint: 'Select object then drag to move',
    toolType: 'Tool Type',
    brushTool: 'Brush',
    fillTool: 'Fill',
    brushSize: 'Brush Size',

    // Tiles
    tileEmpty: 'Empty',
    tileSolid: 'Solid',
    tilePlatform: 'Platform',
    tileSpike: 'Spike',
    tileAcid: 'Acid',
    tileBreakable: 'Breakable',
    tileDoor: 'Door',

    // Objects
    objectSpawnPoint: 'Spawn Point',
    objectEnemySpawn: 'Enemy Spawn',
    objectItem: 'Item',
    objectChest: 'Chest',
    objectSwitch: 'Switch',
    objectNpc: 'NPC',
    objectSavePoint: 'Save Point',
    objectTransition: 'Transition',

    // Zone Management
    zoneManagement: 'Zone Management',
    addZone: 'Add Zone',
    deleteZone: 'Delete Zone',
    zoneName: 'Zone Name',
    zoneColor: 'Zone Color',
    confirmDeleteZone: 'Delete this zone? Rooms will be moved to default zone.',
    cannotDeleteLastZone: 'Cannot delete the last zone',
    assignZone: 'Assign Zone',
    newZone: 'New Zone',

    // Connection Editing
    connectionSelected: 'Connection Selected',
    connectionCondition: 'Connection Condition',
    deleteConnection: 'Delete Connection',
    clickConnectionToEdit: 'Click connection to edit',

    // Room Operations
    splitRoom: 'Split Room',
    splitRoomHint: 'Split complex room into individual rooms',
    cannotSplit: 'Cannot split (single block)',

    // Multi-selection
    multipleRoomsSelected: ' rooms selected',
    batchZoneChange: 'Batch Zone Change',
    batchTypeChange: 'Batch Type Change',
    selectedRoomsList: 'Selected Rooms',
    deleteSelectedRooms: 'Delete Selected Rooms',
    copy: 'Copy',
    paste: 'Paste',
    mixed: 'Mixed',
    selectType: 'Select Type'
  }
}

export function getRoomTypeName(type: string, t: Translations): string {
  const typeMap: Record<string, keyof Translations> = {
    start: 'roomTypeStart',
    hub: 'roomTypeHub',
    normal: 'roomTypeNormal',
    boss: 'roomTypeBoss',
    item: 'roomTypeItem',
    save: 'roomTypeSave',
    shop: 'roomTypeShop',
    stag: 'roomTypeStag',
    map: 'roomTypeMap'
  }
  return t[typeMap[type] || 'roomTypeNormal'] as string
}
