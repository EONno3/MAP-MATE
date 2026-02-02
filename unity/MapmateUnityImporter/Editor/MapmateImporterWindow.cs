using System;
using System.IO;
using UnityEditor;
using UnityEngine;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor
{
    public sealed class MapmateImporterWindow : EditorWindow
    {
        [SerializeField] private TextAsset jsonAsset;
        [SerializeField] private string jsonFilePath;
        [SerializeField] private MapmateTilePalette tilePalette;
        [SerializeField] private MapmatePrefabPalette prefabPalette;
        [SerializeField] private MapmateImportSettings settings;

        [MenuItem("Tools/Mapmate/Import Mapmate Unity JSON")]
        public static void Open()
        {
            GetWindow<MapmateImporterWindow>("Mapmate Import");
        }

        private void OnGUI()
        {
            GUILayout.Label("Mapmate Unity Importer (mapmate.unity/v1)", EditorStyles.boldLabel);
            EditorGUILayout.Space();

            jsonAsset = (TextAsset)EditorGUILayout.ObjectField("JSON(TextAsset)", jsonAsset, typeof(TextAsset), false);
            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.PrefixLabel("JSON File Path");
            EditorGUILayout.SelectableLabel(string.IsNullOrEmpty(jsonFilePath) ? "(none)" : jsonFilePath, GUILayout.Height(EditorGUIUtility.singleLineHeight));
            EditorGUILayout.EndHorizontal();

            using (new EditorGUILayout.HorizontalScope())
            {
                if (GUILayout.Button("Pick JSON file...", GUILayout.Width(140)))
                {
                    var picked = EditorUtility.OpenFilePanel("Select Mapmate Unity JSON", "", "json");
                    if (!string.IsNullOrEmpty(picked))
                    {
                        jsonFilePath = picked;
                        jsonAsset = null; // 둘 중 하나만 사용하도록
                        GUI.FocusControl(null);
                    }
                }

                using (new EditorGUI.DisabledScope(string.IsNullOrEmpty(jsonFilePath) && jsonAsset == null))
                {
                    if (GUILayout.Button("Clear", GUILayout.Width(80)))
                    {
                        jsonFilePath = null;
                        jsonAsset = null;
                        GUI.FocusControl(null);
                    }
                }
            }

            tilePalette = (MapmateTilePalette)EditorGUILayout.ObjectField("Tile Palette", tilePalette, typeof(MapmateTilePalette), false);
            prefabPalette = (MapmatePrefabPalette)EditorGUILayout.ObjectField("Prefab Palette", prefabPalette, typeof(MapmatePrefabPalette), false);
            settings = (MapmateImportSettings)EditorGUILayout.ObjectField("Import Settings", settings, typeof(MapmateImportSettings), false);

            EditorGUILayout.Space();

            var hasJson = jsonAsset != null || !string.IsNullOrEmpty(jsonFilePath);
            using (new EditorGUI.DisabledScope(!hasJson || tilePalette == null || prefabPalette == null || settings == null))
            {
                if (GUILayout.Button("Import to Scene", GUILayout.Height(32)))
                {
                    try
                    {
                        var json = jsonAsset != null ? jsonAsset.text : File.ReadAllText(jsonFilePath);
                        MapmateImporter.ImportFromJsonText(json, tilePalette, prefabPalette, settings);
                        EditorUtility.DisplayDialog("Mapmate Import", "Import 완료", "OK");
                    }
                    catch (Exception ex)
                    {
                        Debug.LogException(ex);
                        EditorUtility.DisplayDialog("Mapmate Import Failed", ex.Message, "OK");
                    }
                }
            }

            EditorGUILayout.Space();
            GUILayout.Label("팁", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox(
                "- JSON 파싱을 위해 com.unity.nuget.newtonsoft-json 패키지가 필요합니다.\n" +
                "- tileId=0(empty)는 기본적으로 배치하지 않습니다.\n" +
                "- 연결은 현재 '문(Door)'로 단일화하여 생성합니다(doorwayA/B 우선, 없으면 portalA/B fallback).\n" +
                "- prefab 매핑이 없으면 빈 GameObject로라도 생성해서 위치/키를 보존합니다.",
                MessageType.Info);
        }
    }
}

