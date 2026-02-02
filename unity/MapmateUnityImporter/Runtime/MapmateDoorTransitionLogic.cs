using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    public static class MapmateDoorTransitionLogic
    {
        public static bool TryBuildRequest(
            int endpointRoomId,
            int fromRoomId,
            int toRoomId,
            string condition,
            Vector2Int worldTile,
            MapmateFacing facing,
            out MapmateDoorTransitionRequest request)
        {
            if (!MapmateDoorTrigger.TryComputeDestinationRoomId(endpointRoomId, fromRoomId, toRoomId, out var dest))
            {
                request = default;
                return false;
            }

            request = new MapmateDoorTransitionRequest(
                fromRoomId: fromRoomId,
                toRoomId: toRoomId,
                endpointRoomId: endpointRoomId,
                destinationRoomId: dest,
                condition: condition,
                worldTile: worldTile,
                facing: facing);
            return true;
        }
    }
}

