export type Language = 'ko' | 'en'

import {
    TUTORIAL_MAP_CANVAS_BG_EN,
    TUTORIAL_MAP_CANVAS_BG_KO,
    TUTORIAL_ROOM_CANVAS_BG_EN,
    TUTORIAL_ROOM_CANVAS_BG_KO,
} from '../lib/shortcutCatalog'

export const tutorialTranslations: Record<Language, Record<string, string>> = {
    ko: {
        // Toolbar Elements
        'toolbar-generate': '맵을 자동 생성합니다.\n(방, 연결선, 핵심 요소 배치)',
        'toolbar-import': '로컬에 저장된 맵 데이터(JSON)를 불러옵니다.',
        'toolbar-export': '현재 맵 데이터를 JSON 파일로 내보냅니다.',
        'toolbar-export-unity': 'Unity 등에서 사용할 수 있는 구조화된 JSON으로 내보냅니다.',
        'toolbar-undo': '이전 단계로 되돌립니다. (Ctrl/Cmd+Z)',
        'toolbar-redo': '되돌린 단계를 다시 실행합니다. (Ctrl/Cmd+Y 또는 Ctrl/Cmd+Shift+Z)',
        'toolbar-tool-select': '선택 도구\n방을 선택하고 드래그하여 이동할 수 있습니다.',
        'toolbar-tool-draw': '그리기 도구\n빈 공간을 클릭&드래그하여 새로운 방을 생성합니다.',
        'toolbar-tool-connect': '연결 도구\n방 두 개를 차례로 클릭하여 연결 선을 만듭니다.',
        'toolbar-tutorial-mode': '튜토리얼 모드를 켜거나 끕니다.\n버튼 위에 마우스를 올리면 기능 설명을 볼 수 있습니다.',
        'toolbar-help': '도움말과 단축키 목록을 확인합니다.',

        // Sidebar: Main panels
        'sidebar-ai-prompt': '자연어 프롬프트를 입력하여 AI 기반 맵을 생성할 수 있습니다.',
        'sidebar-parameters': '맵 생성 시 사용되는 랜덤 시드, 구역 수, 크기 등을 설정합니다.',
        'sidebar-room-info': '선택된 방의 속성(유형, 구역, 크기 등)을 수정합니다.',

        // Sidebar: Room buttons
        'room-delete': '선택된 방을 삭제합니다. (Delete/Backspace 키)',
        'room-edit-detail': '방의 내부(타일, 오브젝트)를 상세하게 편집하는 모드로 들어갑니다. (더블클릭)',
        'sidebar-copy': '선택된 방을 복사합니다. (Ctrl/Cmd+C)',
        'sidebar-paste': '복사한 방을 붙여넣습니다. (Ctrl/Cmd+V)',
        'sidebar-delete-all': '선택된 모든 방을 일괄 삭제합니다.',
        'sidebar-connection-condition': '연결선을 통과하기 위해 필요한 특수 능력을 설정합니다.',
        'sidebar-connection-delete': '두 방 사이의 연결선을 제거합니다.',

        // Zone Mgmt
        'zone-panel': '구역(Zone) 색상과 이름을 관리합니다.\n맵 생성 시 구역별로 방이 묶입니다.',
        'zone-add': '새로운 구역 색상과 이름을 추가합니다.',
        'zone-delete': '이 구역을 삭제합니다. 연결된 방들은 기본값으로 돌아갑니다.',

        // ParamPanel
        'param-generate': '설정된 값을 바탕으로 맵을 새롭게 생성합니다.',

        // Canvases
        'map-canvas-bg': TUTORIAL_MAP_CANVAS_BG_KO,
        'map-canvas-thumbnail': '상세 맵에서 작업한 모습(미니맵)을 활성화하거나 끕니다.',
        'room-canvas-bg': TUTORIAL_ROOM_CANVAS_BG_KO,

        // Room Editor: Toolbar
        'roomeditor-back': '상세 편집을 완료하고 전체 월드 맵으로 돌아갑니다.',
        'roomeditor-save': '변경된 타일과 오브젝트 배치를 현재 방에 저장합니다. (Ctrl/Cmd+S)',
        'roomeditor-reset': '저장하지 않은 모든 변경사항을 되돌리고 초기화합니다.',
        'roomeditor-brush-size': '브러시 크기를 조절합니다.',

        // Room Editor: Modes & Panels
        'roomeditor-tabs': '타일 팔레트와 오브젝트 팔레트를 전환하는 탭입니다.',
        'roomeditor-tools': '지형을 칠할 때 사용할 그리기 도구(도장, 지우개, 채우기)를 선택합니다.',
        'roomeditor-tiles': '현재 클릭한 타일을 화면에 그릴 수 있도록 선택하는 팔레트입니다.',
        'roomeditor-layers': '생성된 레이어들의 목록입니다. 레이어를 관리하고 순서를 변경할 수 있습니다.',
        'roomeditor-playtest': '현재 방을 로컬 미니게임 환경에서 직접 조작하며 테스트해봅니다.',
        'roomeditor-undo': '이전 단계로 되돌립니다. (Ctrl/Cmd+Z)',
        'roomeditor-objects': '오브젝트 팔레트입니다.\n적, 아이템, 스위치, NPC 등을 맵에 배치합니다.',
        'roomeditor-ai': '자연어 프롬프트를 입력하여 해당 구역 모양에 맞는 타일맵을 AI가 자동 생성합니다.',
        'roomeditor-tile-mgr': '사용 중인 타일의 색상과 이름을 변경하거나 불필요한 타일을 삭제할 수 있습니다.',
        'roomeditor-tile-add': '원하는 색상과 이름으로 새로운 종류의 타일을 추가합니다.',
        'roomeditor-tile-reset': '기본 타일만 남기고 추가된 타일들을 모두 삭제하여 초기화합니다.',
        'roomeditor-hints': '자주 사용하는 유용한 키보드/마우스 단축키 팁입니다.',
        'roomeditor-layer-order': '이 레이어를 다른 레이어의 위/아래로 이동시켜 렌더링 순서를 바꿉니다.',
        'roomeditor-layer-visibility': '이 레이어의 보이기/숨기기를 전환합니다.',
        'roomeditor-layer-delete': '이 레이어와 레이어에 포함된 모든 데이터를 영구 삭제합니다.',
        'roomeditor-layer-opacity': '이 레이어의 투명도/불투명도를 조절합니다.',
        'roomeditor-properties': '선택한 오브젝트의 세부 속성 및 태그를 설정합니다.',
        'roomeditor-navigator': '전체 맵 구조에서 현재 방의 위치를 한눈에 파악할 수 있는 내비게이션 창입니다.',

        // Room Editor: Objects
        'roomeditor-tag-unity': '이 오브젝트에 부여할 Unity 컴포넌트 태그를 추가하거나 삭제합니다.',
        'roomeditor-tag-params': '추가된 태그에 종속된 세부 파라미터(속도, 체력 등) 값을 설정합니다.',

        // Playtest
        'playtest-physics': '캐릭터의 물리 엔진 패널을 엽니다.',
        'playtest-exit': '테스트를 종료하고 편집 화면으로 돌아갑니다.',
        'playtest-param-jump': '최대 점프 높이 (타일 단위)를 설정합니다.',
        'playtest-param-airtime': '점프 버튼을 눌렀을 때 최고점에 도달하는 시간입니다.',
        'playtest-param-speed': '캐릭터의 기본 이동 최고 속도를 설정합니다.',
        'playtest-param-accel': '최고 속도에 도달하기까지 걸리는 가속 시간입니다.',
        'playtest-param-friction': '이동을 멈출 때 미끄러지는 마찰력(감속) 시간입니다.',
        'playtest-param-gravity': '점프 후 떨어질 때 적용되는 중력 배수입니다. 높을수록 빨리 떨어집니다.',
        'playtest-param-terminal': '자유 낙하 시 도달할 수 있는 최대 속도입니다.',
        'playtest-param-coyote': '발판에서 벗어난 직후에도 점프가 허용되는 찰나의 시간입니다.',
        'playtest-param-buffer': '착지하기 직전에 점프를 미리 입력해둘 수 있는 시간입니다.',
        'playtest-param-sprint': 'Shift 키를 누를 때 적용되는 달리기 속도 배수입니다.',
    },
    en: {
        // Toolbar Elements
        'toolbar-generate': 'Automatically geneates a new map.\n(Rooms, connections, POIs)',
        'toolbar-import': 'Loads map data (JSON) from your local device.',
        'toolbar-export': 'Exports current map data to a JSON file.',
        'toolbar-export-unity': 'Exports to a structured JSON format ready for Unity.',
        'toolbar-undo': 'Undo the previous action. (Ctrl/Cmd+Z)',
        'toolbar-redo': 'Redo the reverted action. (Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z)',
        'toolbar-tool-select': 'Select Tool\nSelect and drag rooms to move them.',
        'toolbar-tool-draw': 'Draw Tool\nClick & drag on empty space to create a new room.',
        'toolbar-tool-connect': 'Connect Tool\nClick two rooms sequentially to connect them.',
        'toolbar-tutorial-mode': 'Toggle Tutorial Mode.\nHover over buttons to read descriptions.',
        'toolbar-help': 'View the help guide and keyboard shortcuts.',

        // Sidebar: Main panels
        'sidebar-ai-prompt': 'Generate an AI-based map by typing a natural language prompt.',
        'sidebar-parameters': 'Configure map generation settings like seed, zones, and density.',
        'sidebar-room-info': 'Modify properties (type, zone, size) for the selected room.',

        // Sidebar: Room buttons
        'room-delete': 'Delete selected room. (Delete/Backspace key)',
        'room-edit-detail': 'Enter detail editing mode (tiles, objects). (Double Click)',
        'sidebar-copy': 'Copy selected rooms. (Ctrl/Cmd+C)',
        'sidebar-paste': 'Paste copied rooms. (Ctrl/Cmd+V)',
        'sidebar-delete-all': 'Delete all selected rooms completely.',
        'sidebar-connection-condition': 'Set special abilities required to pass this connection route.',
        'sidebar-connection-delete': 'Remove the connection line between the two rooms.',

        // Zone Mgmt
        'zone-panel': 'Manage Zone colors and names.\nRooms are grouped by zones during generation.',
        'zone-add': 'Add a new custom color zone.',
        'zone-delete': 'Delete this zone. Linked rooms will revert to default.',

        // ParamPanel
        'param-generate': 'Regenerate the map using the configured settings below.',

        // Canvases
        'map-canvas-bg': TUTORIAL_MAP_CANVAS_BG_EN,
        'map-canvas-thumbnail': 'Toggle the detail map thumbnail visibility.',
        'room-canvas-bg': TUTORIAL_ROOM_CANVAS_BG_EN,

        // Room Editor: Toolbar
        'roomeditor-back': 'Finish detail editing and return to the World Map.',
        'roomeditor-save': 'Save changed tiles and object placements to this room. (Ctrl/Cmd+S)',
        'roomeditor-reset': 'Revert all unsaved changes and reset the room canvas.',
        'roomeditor-brush-size': 'Adjust the size of the brush.',

        // Room Editor: Modes & Panels
        'roomeditor-tabs': 'Tabs to switch between the Tile Palette and Object Palette.',
        'roomeditor-tools': 'Select drawing tools (Brush, Eraser, Fill) for painting terrain.',
        'roomeditor-tiles': 'Select a tile type to start painting it on the canvas.',
        'roomeditor-layers': 'List of generated layers. Manage visibility, opacity, and rendering order.',
        'roomeditor-playtest': 'Jump directly into a local minigame to test this room.',
        'roomeditor-undo': 'Undo the previous action. (Ctrl/Cmd+Z)',
        'roomeditor-ai': 'Enter a prompt to AI-generate a localized tilemap reflecting the current room bounds.',
        'roomeditor-tile-mgr': 'Manage colors and names of your tiles or delete custom ones.',
        'roomeditor-tile-add': 'Add a new custom tile with a specific color and name.',
        'roomeditor-tile-reset': 'Reset the tile catalog back to default builtin tiles.',
        'roomeditor-hints': 'Useful keyboard and mouse shortcut tips.',
        'roomeditor-layer-order': 'Move this layer up or down in the rendering stack.',
        'roomeditor-layer-visibility': 'Toggle visibility for this layer.',
        'roomeditor-layer-delete': 'Permanently delete this layer and its contents.',
        'roomeditor-layer-opacity': 'Adjust the opacity/transparency of this layer.',
        'roomeditor-properties': 'Edit tag properties and settings for the selected object.',
        'roomeditor-navigator': 'Navigator view to understand where the current room sits in the whole map.',

        // Room Editor: Objects
        'roomeditor-objects': 'Object palette.\nPlace enemies, items, switches, NPCs, and more.',
        'roomeditor-tag-unity': 'Add or remove Unity component tags for this object.',
        'roomeditor-tag-params': 'Configure detailed parameters (speed, health, etc.) for the added tags.',

        // Playtest
        'playtest-physics': 'Adjust underlying character physics engines (jump height, gravity, speed, sprint).',
        'playtest-exit': 'Exit playground and return to editing mode.',
        'playtest-param-jump': 'Set max jump height (in tiles).',
        'playtest-param-airtime': 'Time to reach the apex while holding jump.',
        'playtest-param-speed': 'Set base max move speed.',
        'playtest-param-accel': 'Acceleration time to reach max speed.',
        'playtest-param-friction': 'Deceleration time (friction) when stopping.',
        'playtest-param-gravity': 'Fall gravity multiplier (higher falls faster).',
        'playtest-param-terminal': 'Max fall speed (terminal velocity).',
        'playtest-param-coyote': 'Coyote time: jump allowed shortly after leaving ground.',
        'playtest-param-buffer': 'Jump buffer time before landing.',
        'playtest-param-sprint': 'Sprint speed multiplier while holding Shift.',
    }
}
