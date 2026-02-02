using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Mapmate.UnityImporter.Editor
{
    // NOTE:
    // - 이 모델은 Importer(에디터)에서만 사용됩니다.
    // - tiles는 raw2d/rle1d 모두 지원해야 하므로 JToken으로 받아서 디코딩합니다.

    [Serializable]
    public sealed class MapmateUnityExportV1
    {
        public string schemaVersion;
        public string exportedAt;
        public int tilesPerChunkX;
        public int tilesPerChunkY;
        public TilePalette tilePalette;
        public ObjectPalette objectPalette;
        public List<Room> rooms;
        public List<Connection> connections;

        [Serializable]
        public sealed class TilePalette
        {
            public List<TilePaletteEntry> byId;
        }

        [Serializable]
        public sealed class TilePaletteEntry
        {
            public int id;
            public string key;
        }

        [Serializable]
        public sealed class ObjectPalette
        {
            public List<ObjectPaletteEntry> byKey;
        }

        [Serializable]
        public sealed class ObjectPaletteEntry
        {
            public string key;
            public string prefabKey;
        }

        [Serializable]
        public sealed class Room
        {
            public int id;
            public int zoneId;
            public RoomGrid roomGrid;
            public WorldTileOrigin worldTileOrigin;
            public RoomDetail detail;
        }

        [Serializable]
        public sealed class RoomGrid
        {
            public int x;
            public int y;
            public int w;
            public int h;
        }

        [Serializable]
        public sealed class WorldTileOrigin
        {
            public int x;
            public int y;
        }

        [Serializable]
        public sealed class RoomDetail
        {
            public int tileWidth;
            public int tileHeight;
            public string tilesEncoding; // raw2d | rle1d
            public JToken tiles; // raw2d: int[][], rle1d: [{id,run}]
            public List<RoomObject> objects;
        }

        [Serializable]
        public sealed class RoomObject
        {
            public string key;
            public int x;
            public int y;
            public Dictionary<string, object> properties;
        }

        [Serializable]
        public sealed class Connection
        {
            public int fromId;
            public int toId;
            public string condition;
            public string linkType; // door|portal

            public Doorway doorwayA;
            public Doorway doorwayB;
            public Doorway portalA;
            public Doorway portalB;
        }

        [Serializable]
        public sealed class Doorway
        {
            public int roomId;
            public int worldTileX;
            public int worldTileY;
            public string facing; // UP/DOWN/LEFT/RIGHT
        }
    }
}

