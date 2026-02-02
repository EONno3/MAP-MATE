using System;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateConnectionEndpoints
    {
        internal readonly struct Endpoint
        {
            public readonly int RoomId;
            public readonly int WorldTileX;
            public readonly int WorldTileY;
            public readonly string Facing;

            public Endpoint(int roomId, int worldTileX, int worldTileY, string facing)
            {
                RoomId = roomId;
                WorldTileX = worldTileX;
                WorldTileY = worldTileY;
                Facing = facing ?? "RIGHT";
            }
        }

        // Door 우선(doorwayA/B), 없으면 portalA/B를 Door로 취급하여 fallback
        public static bool TryGetDoorEndpoints(MapmateUnityExportV1.Connection conn, out Endpoint a, out Endpoint b)
        {
            if (conn == null) throw new ArgumentNullException(nameof(conn));

            if (conn.doorwayA != null && conn.doorwayB != null)
            {
                a = FromDoorway(conn.doorwayA);
                b = FromDoorway(conn.doorwayB);
                return true;
            }

            if (conn.portalA != null && conn.portalB != null)
            {
                a = FromDoorway(conn.portalA);
                b = FromDoorway(conn.portalB);
                return true;
            }

            a = default;
            b = default;
            return false;
        }

        private static Endpoint FromDoorway(MapmateUnityExportV1.Doorway d)
        {
            return new Endpoint(d.roomId, d.worldTileX, d.worldTileY, d.facing);
        }
    }
}

