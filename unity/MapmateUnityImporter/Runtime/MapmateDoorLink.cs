using System;
using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    public sealed class MapmateDoorLink : MonoBehaviour
    {
        [Serializable]
        public struct Endpoint
        {
            public int roomId;
            public MapmateFacing facing;
            public Vector2Int worldTile;
        }

        [Header("연결 정보(문)")]
        public int fromRoomId;
        public int toRoomId;
        public string condition;

        [Header("엔드포인트")]
        public Endpoint endpointA;
        public Endpoint endpointB;
    }
}

