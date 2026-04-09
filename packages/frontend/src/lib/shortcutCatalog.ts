export type ShortcutRow = {
  label: string
  description: string
}

export type ShortcutSection = {
  title: string
  rows: ShortcutRow[]
}

/**
 * HelpModal/Sidebar 등 여러 UI에서 "동일한 단축키 안내"를 공유하기 위한 정의 모음.
 *
 * - label 표기 규칙: " / "는 대체키, " + "는 조합키로 통일한다.
 *   예) "Ctrl / Cmd + Z", "Delete / Backspace"
 */

export const WORLD_MAP_HELP_SECTION: ShortcutSection = {
  title: '월드맵 조작',
  rows: [
    { label: '좌클릭', description: '방 선택 (선택된 방은 드래그로 이동)' },
    { label: 'Ctrl / Cmd + 좌클릭', description: '다중 선택 토글' },
    { label: 'Space + 좌클릭 드래그', description: '화면 패닝(이동)' },
    { label: 'Shift + 좌클릭 드래그', description: '화면 패닝(이동)' },
    { label: '휠클릭(가운데 버튼) 드래그', description: '화면 패닝(이동)' },
    { label: '휠 스크롤', description: '화면 줌 인/줌 아웃' },
    { label: '더블 클릭(방)', description: '방 상세 에디터 열기' },
    { label: '더블 클릭(빈 공간)', description: '새 방 추가' },
    { label: 'Delete / Backspace', description: '선택된 방 또는 연결(Connection) 삭제' },
    { label: 'Esc', description: '선택 해제 / 연결 취소' },
  ],
}

export const ROOM_EDITOR_HELP_SECTION: ShortcutSection = {
  title: '방 상세 에디터',
  rows: [
    { label: '1', description: '타일 모드 전환' },
    { label: '1 길게 누르기', description: '타일 방사형(Radial) 휠 메뉴 열기' },
    { label: '2', description: '오브젝트 모드 전환' },
    { label: '2 길게 누르기', description: '오브젝트 방사형(Radial) 휠 메뉴 열기' },
    { label: 'B', description: '브러시 도구 선택' },
    { label: 'G / F', description: '채우기 도구 선택' },
    { label: 'E', description: '지우개 도구 선택 (빈 타일 + 브러시)' },
    { label: 'Space + 좌클릭 드래그', description: '화면 패닝(이동)' },
    { label: 'Alt + 1~9', description: '타일 팔레트 항목 빠른 선택' },
    { label: 'Ctrl / Cmd + S', description: '저장' },
    { label: 'Ctrl / Cmd + Z', description: '실행 취소 (Undo)' },
    { label: 'Ctrl / Cmd + Shift + Z', description: '다시 실행 (Redo)' },
    { label: 'Ctrl / Cmd + Y', description: '다시 실행 (Redo)' },
    { label: 'Delete / Backspace', description: '선택된 오브젝트 삭제' },
  ],
}

export const WORLD_MAP_OVERLAY_INSTRUCTIONS_KO =
  '스크롤: 줌 | Space/Shift+드래그(또는 휠클릭 드래그): 이동 | 클릭: 선택 | Ctrl/Cmd+클릭: 다중선택 | 1/2/3: 도구 | 더블클릭(방): 상세맵 | 더블클릭(빈 공간): 새 방 | Delete/Backspace: 삭제'

export const WORLD_MAP_OVERLAY_INSTRUCTIONS_EN =
  'Scroll: Zoom | Space/Shift+Drag (or middle-click drag): Pan | Click: Select | Ctrl/Cmd+Click: Multi-select | 1/2/3: Tools | Double-click(room): Detail | Double-click(empty): New room | Delete/Backspace: Delete'

export const ROOM_EDITOR_OVERLAY_INSTRUCTIONS_KO =
  '클릭/드래그: 그리기 | Space+드래그: 이동 | 단축키(B/G/F/E): 도구 변경 | Alt+1~9: 팔레트 선택 | Ctrl/Cmd+S: 저장 | Delete/Backspace: 삭제'

export const ROOM_EDITOR_OVERLAY_INSTRUCTIONS_EN =
  'Click/Drag: Paint | Space+Drag: Pan | Keys(B/G/F/E): Tools | Alt+1~9: Palette | Ctrl/Cmd+S: Save | Delete/Backspace: Delete'

export const TUTORIAL_MAP_CANVAS_BG_KO =
  '전체 월드 맵 화면입니다.\n마우스 휠이나 터치패드로 줌인/줌아웃 할 수 있습니다.\n휠클릭(가운데 버튼) 드래그, Shift+드래그, 스페이스바+드래그로 화면을 이동합니다.'

export const TUTORIAL_MAP_CANVAS_BG_EN =
  'Main World Map Canvas.\nZoom in/out with mouse wheel or trackpad.\nPan by middle-click drag, Shift+drag, or Spacebar+drag.'

export const TUTORIAL_ROOM_CANVAS_BG_KO =
  '상세 편집 화면입니다.\n오른쪽 패널에서 브러시나 채우기 도구를 선택한 뒤 타일을 배치해보세요.\n스페이스바+드래그로 화면을 이동합니다.'

export const TUTORIAL_ROOM_CANVAS_BG_EN =
  'Detail Editor Canvas.\nSelect brush or fill tool on the right to place tiles.\nUse Spacebar+Drag to pan around.'

export type SidebarShortcutRow = {
  combo: string
  description: string
}

function compactLabel(label: string): string {
  return label.split(' / ').join('/').split(' + ').join('+')
}

export function sidebarRowFromLabel(label: string, description: string): SidebarShortcutRow {
  return { combo: compactLabel(label), description }
}

export const WORLD_MAP_SIDEBAR_MULTISELECT_SHORTCUTS: SidebarShortcutRow[] = [
  sidebarRowFromLabel('Ctrl / Cmd + A', '전체 선택'),
  sidebarRowFromLabel('Ctrl / Cmd + C', '복사'),
  sidebarRowFromLabel('Ctrl / Cmd + V', '붙여넣기'),
  sidebarRowFromLabel('Ctrl / Cmd + S', '퀵 저장'),
  sidebarRowFromLabel('Delete / Backspace', '삭제'),
  sidebarRowFromLabel('Esc', '선택 해제'),
]

export const WORLD_MAP_SIDEBAR_EMPTY_SELECTION_SHORTCUTS: Array<{ text: string }> = [
  { text: '• 1: 선택 도구' },
  { text: '• 2: 방 그리기' },
  { text: '• 3: 연결 도구' },
  { text: `• Ctrl/Cmd+클릭: 다중 선택` },
  { text: `• ${compactLabel('Ctrl / Cmd + S')}: 퀵 저장` },
  { text: `• ${compactLabel('Ctrl / Cmd + Z')}: 실행취소` },
  { text: `• ${compactLabel('Ctrl / Cmd + Y')} 또는 ${compactLabel('Ctrl / Cmd + Shift + Z')}: 다시실행` },
]

