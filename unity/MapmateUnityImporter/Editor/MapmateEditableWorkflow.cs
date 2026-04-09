using System;
using UnityEditor;
using UnityEngine;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateEditableWorkflow
    {
        public static void MarkImported(Transform mapRoot, string jsonSource, string jsonText)
        {
            if (mapRoot == null) return;

            var state = mapRoot.GetComponent<MapmateMapImportState>();
            if (state == null) state = mapRoot.gameObject.AddComponent<MapmateMapImportState>();

            state.jsonSource = jsonSource;
            state.jsonHashSha256 = MapmateImportHash.ComputeSha256Hex(jsonText);
            state.importedAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

            EditorUtility.SetDirty(state);
        }

        public static void MakeEditable(Transform mapRoot, MapmateImportSettings settings, string jsonSource, string jsonText)
        {
            if (mapRoot == null) throw new ArgumentNullException(nameof(mapRoot));

            MarkImported(mapRoot, jsonSource, jsonText);

            MapmateTilemapBake.BakeAutoToUserTilemaps(mapRoot, clearAutoAfterBake: true, overwriteUserTiles: false);
            MapmateAutoLock.SetAutoLocked(mapRoot, locked: true);

            if (settings != null)
            {
                settings.importTilesIntoAutoTilemaps = false;
                EditorUtility.SetDirty(settings);
                AssetDatabase.SaveAssets();
            }

            var state = mapRoot.GetComponent<MapmateMapImportState>();
            if (state == null) state = mapRoot.gameObject.AddComponent<MapmateMapImportState>();
            state.madeEditable = true;
            state.madeEditableAtUnixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            EditorUtility.SetDirty(state);
        }
    }

    internal static class MapmateAutoLock
    {
        public static void SetAutoLocked(Transform mapRoot, bool locked)
        {
            if (mapRoot == null) return;

            ApplyLocked(mapRoot.Find("Grid/AutoTilemap"), locked);
            ApplyLocked(mapRoot.Find("Grid/Rooms/AutoRooms"), locked);
        }

        private static void ApplyLocked(Transform root, bool locked)
        {
            if (root == null) return;

            var transforms = root.GetComponentsInChildren<Transform>(includeInactive: true);
            for (var i = 0; i < transforms.Length; i++)
            {
                var t = transforms[i];
                if (t == null) continue;
                var go = t.gameObject;

                if (locked)
                {
                    go.hideFlags |= HideFlags.NotEditable;
                }
                else
                {
                    go.hideFlags &= ~HideFlags.NotEditable;
                }

                EditorUtility.SetDirty(go);
            }
        }
    }
}

