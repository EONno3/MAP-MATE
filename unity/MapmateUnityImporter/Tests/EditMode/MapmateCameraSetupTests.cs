using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using Mapmate.UnityImporter.Runtime;
using Mapmate.UnityImporter.Editor;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateCameraSetupTests
    {
        [Test]
        public void EnsureCameraFollow_False_Does_Not_Add_Follow_To_Existing_MainCamera()
        {
            var rootName = "MapmateTestRoot_CameraOff";
            var mainCamGo = new GameObject("Main Camera");
            mainCamGo.tag = "MainCamera";
            mainCamGo.AddComponent<Camera>();

            var tilePalette = ScriptableObject.CreateInstance<MapmateTilePalette>();
            var prefabPalette = ScriptableObject.CreateInstance<MapmatePrefabPalette>();
            var settings = ScriptableObject.CreateInstance<MapmateImportSettings>();
            settings.rootName = rootName;
            settings.ensureCameraFollow = false;
            settings.ensureDefaultTransitionHandler = false;
            settings.playerPrefabKey = string.Empty;
            settings.logImportSummary = false;

            var json = @"{
  ""schemaVersion"": ""mapmate.unity/v1"",
  ""exportedAt"": ""2026-01-01T00:00:00Z"",
  ""tilesPerChunkX"": 10,
  ""tilesPerChunkY"": 6,
  ""tilePalette"": { ""byId"": [] },
  ""objectPalette"": { ""byKey"": [] },
  ""rooms"": [],
  ""connections"": []
}";

            MapmateImporter.ImportFromJsonText(json, tilePalette, prefabPalette, settings);

            Assert.IsNull(mainCamGo.GetComponent<MapmateCameraFollow2D>());

            var root = GameObject.Find(rootName);
            if (root != null) Object.DestroyImmediate(root);
            Object.DestroyImmediate(mainCamGo);
            Object.DestroyImmediate(tilePalette);
            Object.DestroyImmediate(prefabPalette);
            Object.DestroyImmediate(settings);
        }

        [Test]
        public void EnsureCameraFollow_True_Does_Not_Touch_Existing_MainCamera_When_ConfigureExisting_Is_False()
        {
            var rootName = "MapmateTestRoot_CameraProtect";
            var mainCamGo = new GameObject("Main Camera");
            mainCamGo.tag = "MainCamera";
            var cam = mainCamGo.AddComponent<Camera>();
            cam.orthographic = false; // marker

            var tilePalette = ScriptableObject.CreateInstance<MapmateTilePalette>();
            var prefabPalette = ScriptableObject.CreateInstance<MapmatePrefabPalette>();
            var settings = ScriptableObject.CreateInstance<MapmateImportSettings>();
            settings.rootName = rootName;
            settings.ensureCameraFollow = true;
            settings.configureExistingMainCamera = false;
            settings.ensureDefaultTransitionHandler = false;
            settings.playerPrefabKey = string.Empty;
            settings.logImportSummary = false;

            var json = @"{
  ""schemaVersion"": ""mapmate.unity/v1"",
  ""exportedAt"": ""2026-01-01T00:00:00Z"",
  ""tilesPerChunkX"": 10,
  ""tilesPerChunkY"": 6,
  ""tilePalette"": { ""byId"": [] },
  ""objectPalette"": { ""byKey"": [] },
  ""rooms"": [],
  ""connections"": []
}";

            MapmateImporter.ImportFromJsonText(json, tilePalette, prefabPalette, settings);

            Assert.IsNull(mainCamGo.GetComponent<MapmateCameraFollow2D>());
            Assert.IsFalse(cam.orthographic); // unchanged

            var root = GameObject.Find(rootName);
            if (root != null) Object.DestroyImmediate(root);
            Object.DestroyImmediate(mainCamGo);
            Object.DestroyImmediate(tilePalette);
            Object.DestroyImmediate(prefabPalette);
            Object.DestroyImmediate(settings);
        }
    }
}

