using UnityEditor;
using UnityEngine;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateTilemapBakeMenu
    {
        [MenuItem("Tools/Mapmate/Bake Auto -> User (Selected Root, Overwrite & Clear Auto)")]
        public static void BakeSelected_OverwriteAndClear()
        {
            var root = Selection.activeTransform;
            if (root == null)
            {
                EditorUtility.DisplayDialog("Mapmate", "먼저 Mapmate 맵 루트(GameObject)를 선택해주세요.", "OK");
                return;
            }

            MapmateTilemapBake.BakeAutoToUserTilemaps(root, clearAutoAfterBake: true, overwriteUserTiles: true);
            MapmateAutoLock.SetAutoLocked(root, locked: true);
            EditorUtility.DisplayDialog("Mapmate", "Bake 완료: Auto 타일을 User로 복사하고 Auto를 비웠습니다.", "OK");
        }

        [MenuItem("Tools/Mapmate/Bake Auto -> User (Selected Root, Merge & Keep Auto)")]
        public static void BakeSelected_MergeKeepAuto()
        {
            var root = Selection.activeTransform;
            if (root == null)
            {
                EditorUtility.DisplayDialog("Mapmate", "먼저 Mapmate 맵 루트(GameObject)를 선택해주세요.", "OK");
                return;
            }

            MapmateTilemapBake.BakeAutoToUserTilemaps(root, clearAutoAfterBake: false, overwriteUserTiles: false);
            EditorUtility.DisplayDialog("Mapmate", "Bake 완료: User에 비어있는 칸만 채웠습니다(기존 User 편집 유지).", "OK");
        }

        [MenuItem("Tools/Mapmate/Bake Auto -> User (Selected Root, Merge & Clear Auto)")]
        public static void BakeSelected_MergeAndClear()
        {
            var root = Selection.activeTransform;
            if (root == null)
            {
                EditorUtility.DisplayDialog("Mapmate", "먼저 Mapmate 맵 루트(GameObject)를 선택해주세요.", "OK");
                return;
            }

            MapmateTilemapBake.BakeAutoToUserTilemaps(root, clearAutoAfterBake: true, overwriteUserTiles: false);
            MapmateAutoLock.SetAutoLocked(root, locked: true);
            EditorUtility.DisplayDialog("Mapmate", "Bake 완료: User에 비어있는 칸만 채우고 Auto를 비웠습니다.", "OK");
        }

        [MenuItem("Tools/Mapmate/Auto Area/Lock Auto Tilemaps (Selected Root)")]
        public static void LockAuto_SelectedRoot()
        {
            var root = Selection.activeTransform;
            if (root == null)
            {
                EditorUtility.DisplayDialog("Mapmate", "먼저 Mapmate 맵 루트(GameObject)를 선택해주세요.", "OK");
                return;
            }

            MapmateAutoLock.SetAutoLocked(root, locked: true);
            EditorUtility.DisplayDialog("Mapmate", "Auto 타일맵을 잠궜습니다(NotEditable).", "OK");
        }

        [MenuItem("Tools/Mapmate/Auto Area/Unlock Auto Tilemaps (Selected Root)")]
        public static void UnlockAuto_SelectedRoot()
        {
            var root = Selection.activeTransform;
            if (root == null)
            {
                EditorUtility.DisplayDialog("Mapmate", "먼저 Mapmate 맵 루트(GameObject)를 선택해주세요.", "OK");
                return;
            }

            MapmateAutoLock.SetAutoLocked(root, locked: false);
            EditorUtility.DisplayDialog("Mapmate", "Auto 타일맵 잠금을 해제했습니다.", "OK");
        }

        [MenuItem("Tools/Mapmate/Bake Auto -> User (Auto Root Name Search, Overwrite & Clear Auto)")]
        public static void BakeByDefaultRootName()
        {
            var root = GameObject.Find("MapmateMapRoot")?.transform;
            if (root == null)
            {
                EditorUtility.DisplayDialog("Mapmate", "씬에서 'MapmateMapRoot'를 찾지 못했습니다. 루트를 선택한 뒤 Selected Root 메뉴를 사용해주세요.", "OK");
                return;
            }

            MapmateTilemapBake.BakeAutoToUserTilemaps(root, clearAutoAfterBake: true, overwriteUserTiles: true);
            MapmateAutoLock.SetAutoLocked(root, locked: true);
            EditorUtility.DisplayDialog("Mapmate", "Bake 완료: Auto 타일을 User로 복사하고 Auto를 비웠습니다.", "OK");
        }
    }
}

