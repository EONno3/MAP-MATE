using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.Tilemaps;
using Mapmate.UnityImporter.Editor;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateLayeredTilemapImportTests
    {
        [Test]
        public void PerRoom_When_Layered_Creates_Layers_And_Paints_By_TileId()
        {
            var rootName = "MapmateTestRoot_Layered";

            var tilePalette = ScriptableObject.CreateInstance<MapmateTilePalette>();
            var prefabPalette = ScriptableObject.CreateInstance<MapmatePrefabPalette>();
            var settings = ScriptableObject.CreateInstance<MapmateImportSettings>();
            settings.rootName = rootName;
            settings.tilemapLayout = MapmateTilemapLayout.PerRoom;
            settings.useLayeredTilemaps = true;
            settings.importTilesIntoAutoTilemaps = true;
            settings.ensureCameraFollow = false;
            settings.ensureDefaultTransitionHandler = false;
            settings.playerPrefabKey = string.Empty;
            settings.logImportSummary = false;

            // tileId=1..6 매핑(모두 같은 Tile 인스턴스여도 무방)
            var tile = ScriptableObject.CreateInstance<Tile>();
            var so = new SerializedObject(tilePalette);
            var entries = so.FindProperty("entries");
            for (var id = 1; id <= 6; id++)
            {
                var idx = entries.arraySize;
                entries.InsertArrayElementAtIndex(idx);
                var e = entries.GetArrayElementAtIndex(idx);
                e.FindPropertyRelative("tileId").intValue = id;
                e.FindPropertyRelative("tileKey").stringValue = $"t{id}";
                e.FindPropertyRelative("tile").objectReferenceValue = tile;
            }
            so.ApplyModifiedPropertiesWithoutUndo();
            tilePalette.RebuildIndex();

            // 2x2:
            // (0,0)=solid(1) -> Ground
            // (1,0)=platform(2) -> OneWay
            // (0,1)=spike(3) -> Hazard
            // (1,1)=door(6) -> Deco
            var json = @"{
  ""schemaVersion"": ""mapmate.unity/v1"",
  ""exportedAt"": ""2026-01-01T00:00:00Z"",
  ""tilesPerChunkX"": 10,
  ""tilesPerChunkY"": 6,
  ""tilePalette"": { ""byId"": [] },
  ""objectPalette"": { ""byKey"": [] },
  ""rooms"": [
    { ""id"": 1, ""zoneId"": 1, ""roomGrid"": {""x"":0,""y"":0,""w"":1,""h"":1}, ""worldTileOrigin"": {""x"":0,""y"":0},
      ""detail"": { ""tileWidth"": 2, ""tileHeight"": 2, ""tilesEncoding"": ""raw2d"", ""tiles"": [[1,2],[3,6]], ""objects"": [] } }
  ],
  ""connections"": []
}";

            MapmateImporter.ImportFromJsonText(json, tilePalette, prefabPalette, settings);

            var root = GameObject.Find(rootName);
            Assert.IsNotNull(root);

            var roomRoot = root.transform.Find("Grid/Rooms/AutoRooms/Room_1");
            Assert.IsNotNull(roomRoot);

            var ground = roomRoot.Find("AutoTilemap");
            var oneWay = roomRoot.Find("AutoTilemap_OneWay");
            var hazard = roomRoot.Find("AutoTilemap_Hazard");
            var deco = roomRoot.Find("AutoTilemap_Deco");
            Assert.IsNotNull(ground);
            Assert.IsNotNull(oneWay);
            Assert.IsNotNull(hazard);
            Assert.IsNotNull(deco);

            var groundTm = ground.GetComponent<Tilemap>();
            var oneWayTm = oneWay.GetComponent<Tilemap>();
            var hazardTm = hazard.GetComponent<Tilemap>();
            var decoTm = deco.GetComponent<Tilemap>();
            Assert.IsNotNull(groundTm);
            Assert.IsNotNull(oneWayTm);
            Assert.IsNotNull(hazardTm);
            Assert.IsNotNull(decoTm);

            Assert.IsNotNull(groundTm.GetTile(new Vector3Int(0, 0, 0)));
            Assert.IsNotNull(oneWayTm.GetTile(new Vector3Int(1, 0, 0)));
            Assert.IsNotNull(hazardTm.GetTile(new Vector3Int(0, 1, 0)));
            Assert.IsNotNull(decoTm.GetTile(new Vector3Int(1, 1, 0)));

            // Physics expectations
            Assert.IsNotNull(ground.GetComponent<TilemapCollider2D>());
            Assert.IsNotNull(ground.GetComponent<CompositeCollider2D>());

            var oneWayCol = oneWay.GetComponent<TilemapCollider2D>();
            Assert.IsNotNull(oneWayCol);
            Assert.IsNotNull(oneWay.GetComponent<PlatformEffector2D>());
            Assert.IsTrue(oneWayCol.usedByEffector);

            var hazardCol = hazard.GetComponent<TilemapCollider2D>();
            Assert.IsNotNull(hazardCol);
            Assert.IsTrue(hazardCol.isTrigger);

            Assert.IsNull(deco.GetComponent<TilemapCollider2D>());

            Object.DestroyImmediate(root);
            Object.DestroyImmediate(tilePalette);
            Object.DestroyImmediate(prefabPalette);
            Object.DestroyImmediate(settings);
            Object.DestroyImmediate(tile);
        }
    }
}

