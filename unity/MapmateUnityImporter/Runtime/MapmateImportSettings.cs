using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    [CreateAssetMenu(menuName = "Mapmate/Import Settings", fileName = "MapmateImportSettings")]
    public sealed class MapmateImportSettings : ScriptableObject
    {
        [Header("리임포트/편집 보존")]
        [Tooltip("PreserveUserEdits: Auto 영역만 갱신하고 User 편집은 유지합니다(권장).")]
        public MapmateReimportMode reimportMode = MapmateReimportMode.PreserveUserEdits;

        [Tooltip("씬 루트 하위의 자동 생성 영역 이름")]
        public string autoRootName = "Auto";

        [Tooltip("씬 루트 하위의 사용자 편집 영역 이름(임포터가 삭제/초기화하지 않음)")]
        public string userRootName = "User";

        [Header("타일맵 생성")]
        public string rootName = "MapmateMapRoot";
        public string gridName = "Grid";
        
        [Tooltip("타일맵 생성 방식. PerRoom을 권장합니다(편집/관리 용이).")]
        public MapmateTilemapLayout tilemapLayout = MapmateTilemapLayout.PerRoom;

        [Tooltip("Grid 하위의 Rooms 루트 이름")]
        public string roomsRootName = "Rooms";

        [Tooltip("Rooms 하위의 Auto 룸 타일맵 루트 이름(재임포트 시 갱신됨)")]
        public string autoRoomsRootName = "AutoRooms";

        [Tooltip("Rooms 하위의 User 룸 타일맵 루트 이름(재임포트에도 유지됨)")]
        public string userRoomsRootName = "UserRooms";

        [Tooltip("자동 생성 타일맵(임포트 결과가 그려지는 Tilemap)")]
        public string autoTilemapName = "AutoTilemap";

        [Tooltip("사용자 편집용 타일맵(재임포트에서도 유지)")]
        public string userTilemapName = "UserTilemap";

        [Tooltip("레거시: true면 root 하위 전체를 삭제합니다. PreserveUserEdits를 원하면 false를 권장합니다.")]
        public bool clearExistingChildren = false;

        [Header("좌표/스케일")]
        public float unitsPerTile = 1f; // 보통 Unity Tilemap은 1 unit = 1 tile
        public float zLayerTiles = 0f;
        public float zLayerObjects = -1f;
        public float zLayerLinks = -0.5f;

        [Tooltip("타일 좌표를 Unity 월드 좌표로 배치할 때 셀의 중심에 놓습니다(권장).")]
        public bool placeAtCellCenter = true;

        [Header("타일맵 물리(충돌)")]
        public bool addTilemapCollider2D = true;
        public bool addCompositeCollider2D = true;

        [Header("로그/리포트")]
        public bool logImportSummary = true;

        [Header("연결(door/portal) 생성")]
        public string linksRootName = "Links";
        public string doorsRootName = "Doors";
        public string portalsRootName = "Portals";

        [Tooltip("Door/Portal 생성 시 기준이 되는 프리팹 키(선택). 비어 있으면 빈 GameObject로 생성")]
        public string doorPrefabKey = "Door";
        public string portalPrefabKey = "Portal";

        [Header("플레이(기본 구성)")]
        [Tooltip("플레이어 프리팹 키(프리팹 팔레트에서 매핑). 비어 있으면 생성하지 않습니다.")]
        public string playerPrefabKey = "Player";

        [Tooltip("씬에 기본 전환 핸들러(MapmateBasicDoorTransitionHandler2D)를 자동 추가합니다.")]
        public bool ensureDefaultTransitionHandler = true;

        [Tooltip("씬에 기본 카메라 팔로우(MapmateCameraFollow2D)를 자동 추가합니다.")]
        public bool ensureCameraFollow = false;

        [Tooltip("true면 기존 Main Camera에도 팔로우를 부착/설정합니다. false면 기존 카메라는 건드리지 않고, 카메라가 없을 때만 새로 생성합니다(권장).")]
        public bool configureExistingMainCamera = false;

        [Header("문(Door) 엔드포인트 트리거")]
        public bool addDoorEndpointBoxCollider2D = true;
        public Vector2 doorEndpointColliderSize = new Vector2(0.9f, 0.9f);
        public bool doorEndpointColliderIsTrigger = true;

        [Header("문(Door) 엔드포인트 컴포넌트")]
        public bool addDoorEndpointTriggerComponent = true;

        [Header("문(Door) 자동 전환(선택)")]
        [Tooltip("엔드포인트에 MapmateDoorAutoTransition2D를 자동 부착합니다. (핸들러는 프로젝트에서 직접 지정)")]
        public bool addDoorEndpointAutoTransition2D = true;
    }
}

