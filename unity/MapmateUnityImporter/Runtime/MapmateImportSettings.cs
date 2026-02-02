using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    [CreateAssetMenu(menuName = "Mapmate/Import Settings", fileName = "MapmateImportSettings")]
    public sealed class MapmateImportSettings : ScriptableObject
    {
        [Header("타일맵 생성")]
        public string rootName = "MapmateMapRoot";
        public string gridName = "Grid";
        public string tilemapName = "Tilemap";
        public bool clearExistingChildren = true;

        [Header("좌표/스케일")]
        public float unitsPerTile = 1f; // 보통 Unity Tilemap은 1 unit = 1 tile
        public float zLayerTiles = 0f;
        public float zLayerObjects = -1f;
        public float zLayerLinks = -0.5f;

        [Tooltip("타일 좌표를 Unity 월드 좌표로 배치할 때 셀의 중심에 놓습니다(권장).")]
        public bool placeAtCellCenter = true;

        [Header("연결(door/portal) 생성")]
        public string linksRootName = "Links";
        public string doorsRootName = "Doors";
        public string portalsRootName = "Portals";

        [Tooltip("Door/Portal 생성 시 기준이 되는 프리팹 키(선택). 비어 있으면 빈 GameObject로 생성")]
        public string doorPrefabKey = "Door";
        public string portalPrefabKey = "Portal";

        [Header("문(Door) 엔드포인트 트리거")]
        public bool addDoorEndpointBoxCollider2D = true;
        public Vector2 doorEndpointColliderSize = new Vector2(0.9f, 0.9f);
        public bool doorEndpointColliderIsTrigger = true;

        [Header("문(Door) 엔드포인트 컴포넌트")]
        public bool addDoorEndpointTriggerComponent = true;

        [Header("문(Door) 자동 전환(선택)")]
        [Tooltip("엔드포인트에 MapmateDoorAutoTransition2D를 자동 부착합니다. (핸들러는 프로젝트에서 직접 지정)")]
        public bool addDoorEndpointAutoTransition2D = false;
    }
}

