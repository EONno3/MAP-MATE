using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    public readonly struct MapmateDoorTransitionRequest
    {
        public readonly int fromRoomId;
        public readonly int toRoomId;
        public readonly int endpointRoomId;
        public readonly int destinationRoomId;
        public readonly string condition;
        public readonly Vector2Int worldTile;
        public readonly MapmateFacing facing;

        public MapmateDoorTransitionRequest(
            int fromRoomId,
            int toRoomId,
            int endpointRoomId,
            int destinationRoomId,
            string condition,
            Vector2Int worldTile,
            MapmateFacing facing)
        {
            this.fromRoomId = fromRoomId;
            this.toRoomId = toRoomId;
            this.endpointRoomId = endpointRoomId;
            this.destinationRoomId = destinationRoomId;
            this.condition = condition ?? string.Empty;
            this.worldTile = worldTile;
            this.facing = facing;
        }
    }
}

