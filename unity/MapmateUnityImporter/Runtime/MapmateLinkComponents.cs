using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    public enum MapmateLinkType
    {
        Door = 0,
        Portal = 1,
    }

    public enum MapmateFacing
    {
        Up = 0,
        Down = 1,
        Left = 2,
        Right = 3,
    }

    public sealed class MapmateLinkEndpoint : MonoBehaviour
    {
        [Header("연결 정보")]
        public MapmateLinkType linkType;
        public int fromRoomId;
        public int toRoomId;
        public string condition;

        [Header("이 엔드포인트 정보")]
        public int roomId;
        public MapmateFacing facing;
        public Vector2Int worldTile;
    }
}

