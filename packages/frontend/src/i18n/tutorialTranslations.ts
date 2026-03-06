export type Language = 'ko' | 'en'

export const tutorialTranslations: Record<Language, Record<string, string>> = {
    ko: {
        // Toolbar Elements
        'toolbar-generate': '맵을 자동 생성합니다.\n(방, 연결선, 핵심 요소 배치)',
        'toolbar-import': '로컬에 저장된 맵 데이터(JSON)를 불러옵니다.',
        'toolbar-export': '현재 맵 데이터를 JSON 파일로 내보냅니다.',
        'toolbar-export-unity': 'Unity 등에서 사용할 수 있는 구조화된 JSON으로 내보냅니다.',
        'toolbar-undo': '이전 단계로 되돌립니다. (Ctrl+Z)',
        'toolbar-redo': '되돌린 단계를 다시 실행합니다. (Ctrl+Y)',
        'toolbar-tool-select': '선택 도구\n방을 선택하고 드래그하여 이동할 수 있습니다.',
        'toolbar-tool-draw': '그리기 도구\n빈 공간을 클릭&드래그하여 새로운 방을 생성합니다.',
        'toolbar-tool-connect': '연결 도구\n방 두 개를 차례로 클릭하여 연결 선을 만듭니다.',
        'toolbar-tutorial-mode': '튜토리얼 모드를 켜거나 끕니다.\n버튼 위에 마우스를 올리면 기능 설명을 볼 수 있습니다.',
        'toolbar-help': '도움말과 단축키 목록을 확인합니다.',

        // Sidebar: Main panels
        'sidebar-ai-prompt': '자연어 프롬프트를 입력하여 AI 기반 맵을 생성할 수 있습니다.',
        'sidebar-parameters': '맵 생성 시 사용되는 랜덤 시드, 구역 수, 크기 등을 설정합니다.',
        'sidebar-room-info': '선택된 방의 속성(유형, 구역, 크기 등)을 수정합니다.',
        'sidebar-connection-info': '선택된 연결선의 조건을 설정하거나 삭제합니다.',
        'sidebar-multi-select': '선택된 여러 방의 구역이나 유형을 한 번에 변경합니다.',

        // Sidebar: Room buttons
        'room-delete': '결정된 방을 삭제합니다. (Delete 키)',
        'room-edit-detail': '방의 내부(타일, 오브젝트)를 상세하게 편집하는 모드로 들어갑니다. (더블클릭)',
        'room-split': '크기가 큰 복합 방을 1x1 단위의 여러 개 방으로 쪼갭니다.',

        // Zone Mgmt
        'zone-panel': '구역(Zone) 색상과 이름을 관리합니다.\n맵 생성 시 구역별로 방이 묶입니다.',

        // Room Editor: Toolbar
        'roomeditor-back': '상세 편집을 완료하고 전체 월드 맵으로 돌아갑니다.',
        'roomeditor-save': '변경된 타일과 오브젝트 배치를 현재 방에 저장합니다.',
        'roomeditor-reset': '저장하지 않은 모든 변경사항을 되돌리고 초기화합니다.',
        'roomeditor-tool-brush': '브러시 도구 (단축키: B)\n타일을 하나씩 클릭하거나 드래그하여 칠합니다.',
        'roomeditor-tool-fill': '채우기 도구 (단축키: G)\n비어있는 공간이나 같은 종류의 타일 영역을 한 번에 칠합니다.',
        'roomeditor-tool-erase': '지우개 도구 (단축키: E)\n타일이나 오브젝트를 지웁니다.',
        'roomeditor-brush-size': '브러시 크기를 조절합니다.',

        // Room Editor: Modes
        'roomeditor-mode-tile': '타일 배치 모드\n벽, 바닥, 함정 등의 지형을 칠할 수 있습니다.',
        'roomeditor-mode-object': '오브젝트 배치 모드\n적, 아이템, 스위치, NPC 등을 맵에 배치합니다.',
        'roomeditor-cancel-selection': '현재 선택된 타일이나 오브젝트를 해제합니다.'
    },
    en: {
        // Toolbar Elements
        'toolbar-generate': 'Automatically geneates a new map.\n(Rooms, connections, POIs)',
        'toolbar-import': 'Loads map data (JSON) from your local device.',
        'toolbar-export': 'Exports current map data to a JSON file.',
        'toolbar-export-unity': 'Exports to a structured JSON format ready for Unity.',
        'toolbar-undo': 'Undo the previous action. (Ctrl+Z)',
        'toolbar-redo': 'Redo the reverted action. (Ctrl+Y)',
        'toolbar-tool-select': 'Select Tool\nSelect and drag rooms to move them.',
        'toolbar-tool-draw': 'Draw Tool\nClick & drag on empty space to create a new room.',
        'toolbar-tool-connect': 'Connect Tool\nClick two rooms sequentially to connect them.',
        'toolbar-tutorial-mode': 'Toggle Tutorial Mode.\nHover over buttons to read descriptions.',
        'toolbar-help': 'View the help guide and keyboard shortcuts.',

        // Sidebar: Main panels
        'sidebar-ai-prompt': 'Generate an AI-based map by typing a natural language prompt.',
        'sidebar-parameters': 'Configure map generation settings like seed, zones, and density.',
        'sidebar-room-info': 'Modify properties (type, zone, size) for the selected room.',
        'sidebar-connection-info': 'Set conditions or delete the selected connection.',
        'sidebar-multi-select': 'Batch edit zone or room type for multiple selected rooms.',

        // Sidebar: Room buttons
        'room-delete': 'Delete selected room. (Delete key)',
        'room-edit-detail': 'Enter detail editing mode (tiles, objects). (Double Click)',
        'room-split': 'Split a large composite room into smaller 1x1 rooms.',

        // Zone Mgmt
        'zone-panel': 'Manage Zone colors and names.\nRooms are grouped by zones during generation.',

        // Room Editor: Toolbar
        'roomeditor-back': 'Finish detail editing and return to the World Map.',
        'roomeditor-save': 'Save changed tiles and object placements to this room.',
        'roomeditor-reset': 'Revert all unsaved changes and reset the room canvas.',
        'roomeditor-tool-brush': 'Brush Tool (HotKey: B)\nClick or drag to paint tiles one by one.',
        'roomeditor-tool-fill': 'Fill Tool (HotKey: G)\nFill an empty area or contiguous area of the same tile.',
        'roomeditor-tool-erase': 'Eraser Tool (HotKey: E)\nRemove tiles or objects.',
        'roomeditor-brush-size': 'Adjust the size of the brush.',

        // Room Editor: Modes
        'roomeditor-mode-tile': 'Tile Palette Mode\nPaint terrain elements (walls, floors, traps).',
        'roomeditor-mode-object': 'Object Palette Mode\nPlace entities like enemies, items, switches, NPCs.',
        'roomeditor-cancel-selection': 'Deselect current tile or object.'
    }
}
