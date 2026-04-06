using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.Tilemaps;
using Mapmate.UnityImporter.Editor;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmatePerRoomTilemapImportTests
    {
        [Test]
        public void PerRoom_Imports_Create_Room_AutoTilemaps_Under_Grid_Rooms()
        {
            var rootName = "MapmateTestRoot_PerRoom";

            var tilePalette = ScriptableObject.CreateInstance<MapmateTilePalette>();
            var prefabPalette = ScriptableObject.CreateInstance<MapmatePrefabPalette>();
            var settings = ScriptableObject.CreateInstance<MapmateImportSettings>();
            settings.rootName = rootName;
            settings.tilemapLayout = MapmateTilemapLayout.PerRoom;
            settings.ensureCameraFollow = false;
            settings.ensureDefaultTransitionHandler = false;
            settings.playerPrefabKey = string.Empty;
            settings.logImportSummary = false;

            // tileId=1 매핑
            var tile = ScriptableObject.CreateInstance<Tile>();
            var so = new SerializedObject(tilePalette);
            var entries = so.FindProperty("entries");
            entries.InsertArrayElementAtIndex(0);
            var e = entries.GetArrayElementAtIndex(0);
            e.FindPropertyRelative("tileId").intValue = 1;
            e.FindPropertyRelative("tileKey").stringValue = "solid";
            e.FindPropertyRelative("tile").objectReferenceValue = tile;
            so.ApplyModifiedPropertiesWithoutUndo();

            tilePalette.RebuildIndex();

            var json = @"{
  ""schemaVersion"": ""mapmate.unity/v1"",
  ""exportedAt"": ""2026-01-01T00:00:00Z"",
  ""tilesPerChunkX"": 10,
  ""tilesPerChunkY"": 6,
  ""tilePalette"": { ""byId"": [{""id"":1,""key"":""solid""}] },
  ""objectPalette"": { ""byKey"": [] },
  ""rooms"": [
    { ""id"": 1, ""zoneId"": 1, ""roomGrid"": {""x"":0,""y"":0,""w"":1,""h"":1}, ""worldTileOrigin"": {""x"":0,""y"":0},
      ""detail"": { ""tileWidth"": 2, ""tileHeight"": 2, ""tilesEncoding"": ""raw2d"", ""tiles"": [[1,0],[0,0]], ""objects"": [] } },
    { ""id"": 2, ""zoneId"": 1, ""roomGrid"": {""x"":1,""y"":0,""w"":1,""h"":1}, ""worldTileOrigin"": {""x"":10,""y"":0},
      ""detail"": { ""tileWidth"": 2, ""tileHeight"": 2, ""tilesEncoding"": ""raw2d"", ""tiles"": [[1,0],[0,0]], ""objects"": [] } }
  ],
  ""connections"": []
}";

            MapmateImporter.ImportFromJsonText(json, tilePalette, prefabPalette, settings);

            var root = GameObject.Find(rootName);
            Assert.IsNotNull(root);

            var room1AutoTilemap = root.transform.Find("Grid/Rooms/AutoRooms/Room_1/AutoTilemap");
            var room2AutoTilemap = root.transform.Find("Grid/Rooms/AutoRooms/Room_2/AutoTilemap");
            Assert.IsNotNull(room1AutoTilemap);
            Assert.IsNotNull(room2AutoTilemap);

            // Room_1 타일은 local (0,0)에 존재해야 함
            var tm1 = room1AutoTilemap.GetComponent<Tilemap>();
            Assert.IsNotNull(tm1);
            Assert.IsNotNull(tm1.GetTile(new Vector3Int(0, 0, 0)));

            // cleanup
            Object.DestroyImmediate(root);
            Object.DestroyImmediate(tilePalette);
            Object.DestroyImmediate(prefabPalette);
            Object.DestroyImmediate(settings);
            Object.DestroyImmediate(tile);
        }
    }
}

