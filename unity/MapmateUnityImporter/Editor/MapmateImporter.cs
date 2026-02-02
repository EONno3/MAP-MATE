using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEditor;
using UnityEngine;
using UnityEngine.Tilemaps;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateImporter
    {
        public static void ImportFromJsonText(
            string json,
            MapmateTilePalette tilePaletteAsset,
            MapmatePrefabPalette prefabPaletteAsset,
            MapmateImportSettings settings)
        {
            if (string.IsNullOrWhiteSpace(json)) throw new ArgumentException("json is empty");
            if (tilePaletteAsset == null) throw new ArgumentNullException(nameof(tilePaletteAsset));
            if (prefabPaletteAsset == null) throw new ArgumentNullException(nameof(prefabPaletteAsset));
            if (settings == null) throw new ArgumentNullException(nameof(settings));

            var data = JsonConvert.DeserializeObject<MapmateUnityExportV1>(json);
            if (data == null) throw new Exception("Failed to parse JSON (null)");
            if (data.schemaVersion != "mapmate.unity/v1")
                throw new Exception($"Unsupported schemaVersion: {data.schemaVersion}");

            tilePaletteAsset.RebuildIndex();
            prefabPaletteAsset.RebuildIndex();

            var root = GetOrCreateRoot(settings.rootName);
            if (settings.clearExistingChildren)
            {
                ClearChildrenImmediate(root.transform);
            }

            // Grid + Tilemap
            var gridGo = new GameObject(settings.gridName);
            gridGo.transform.SetParent(root.transform, false);
            var grid = gridGo.AddComponent<Grid>();
            grid.cellSize = new Vector3(settings.unitsPerTile, settings.unitsPerTile, 0f);

            var tilemapGo = new GameObject(settings.tilemapName);
            tilemapGo.transform.SetParent(gridGo.transform, false);
            tilemapGo.transform.localPosition = new Vector3(0f, 0f, settings.zLayerTiles);
            var tilemap = tilemapGo.AddComponent<Tilemap>();
            tilemapGo.AddComponent<TilemapRenderer>();

            // Rooms
            var roomsById = new Dictionary<int, MapmateUnityExportV1.Room>();
            var roomsRoot = new GameObject("Rooms");
            roomsRoot.transform.SetParent(root.transform, false);

            foreach (var room in data.rooms ?? new List<MapmateUnityExportV1.Room>())
            {
                roomsById[room.id] = room;
                var roomGo = new GameObject($"Room_{room.id}");
                roomGo.transform.SetParent(roomsRoot.transform, false);

                // tiles
                var detail = room.detail;
                var tiles = MapmateTileDecoder.DecodeTo2D(detail);
                var originX = room.worldTileOrigin.x;
                var originY = room.worldTileOrigin.y;

                for (var y = 0; y < detail.tileHeight; y++)
                for (var x = 0; x < detail.tileWidth; x++)
                {
                    var tileId = tiles[y, x];
                    if (tileId == 0) continue; // empty
                    if (!tilePaletteAsset.TryGetTileById(tileId, out var tile)) continue;
                    tilemap.SetTile(new Vector3Int(originX + x, originY + y, 0), tile);
                }

                // objects
                var objsRoot = new GameObject("Objects");
                objsRoot.transform.SetParent(roomGo.transform, false);
                objsRoot.transform.localPosition = new Vector3(0f, 0f, settings.zLayerObjects);

                foreach (var obj in detail.objects ?? new List<MapmateUnityExportV1.RoomObject>())
                {
                    if (obj == null) continue;
                    var prefabKey = obj.key; // v1: key를 prefabKey로 사용(팔레트에서 매핑)
                    if (!prefabPaletteAsset.TryGetPrefab(prefabKey, out var prefab) || prefab == null)
                    {
                        // 매핑이 없으면 빈 오브젝트라도 생성해서 위치/키를 보존
                        var fallback = new GameObject($"Obj_{prefabKey}");
                        fallback.transform.SetParent(objsRoot.transform, false);
                        fallback.transform.position = ToWorld(grid, originX + obj.x, originY + obj.y, settings.zLayerObjects, settings.placeAtCellCenter);
                        continue;
                    }

                    var inst = (GameObject)PrefabUtility.InstantiatePrefab(prefab, objsRoot.transform);
                    inst.name = $"{prefabKey}_{room.id}_{obj.x}_{obj.y}";
                    inst.transform.position = ToWorld(grid, originX + obj.x, originY + obj.y, settings.zLayerObjects, settings.placeAtCellCenter);
                }
            }

            // Connections
            var linksRoot = new GameObject(settings.linksRootName);
            linksRoot.transform.SetParent(root.transform, false);

            var doorsRoot = new GameObject(settings.doorsRootName);
            doorsRoot.transform.SetParent(linksRoot.transform, false);

            foreach (var conn in data.connections ?? new List<MapmateUnityExportV1.Connection>())
            {
                if (conn == null) continue;

                // Door로 단일화:
                // - doorwayA/B 있으면 사용
                // - 없으면 portalA/B를 Door로 취급하여 fallback
                if (!MapmateConnectionEndpoints.TryGetDoorEndpoints(conn, out var a, out var b))
                {
                    Debug.LogWarning($"[MapmateImporter] Connection missing endpoints (from={conn.fromId}, to={conn.toId}). Skipped.");
                    continue;
                }

                prefabPaletteAsset.TryGetPrefab(settings.doorPrefabKey, out var doorPrefab);
                var doorRoot = CreateDoorLinkRoot(doorsRoot.transform, doorPrefab, conn.fromId, conn.toId);
                doorRoot.transform.position = ToWorld(grid, a.WorldTileX, a.WorldTileY, settings.zLayerLinks, settings.placeAtCellCenter);

                var doorLink = doorRoot.GetComponent<MapmateDoorLink>();
                if (doorLink == null) doorLink = doorRoot.AddComponent<MapmateDoorLink>();

                doorLink.fromRoomId = conn.fromId;
                doorLink.toRoomId = conn.toId;
                doorLink.condition = conn.condition;

                doorLink.endpointA = new MapmateDoorLink.Endpoint
                {
                    roomId = a.RoomId,
                    worldTile = new Vector2Int(a.WorldTileX, a.WorldTileY),
                    facing = ParseFacing(a.Facing)
                };
                doorLink.endpointB = new MapmateDoorLink.Endpoint
                {
                    roomId = b.RoomId,
                    worldTile = new Vector2Int(b.WorldTileX, b.WorldTileY),
                    facing = ParseFacing(b.Facing)
                };

                // (기존 방식과 유사하게) 각 엔드포인트 위치에도 GameObject를 두어서
                // 콜라이더/트리거를 붙이기 쉽게 해둡니다.
                CreateDoorEndpointObject(grid, settings, doorRoot.transform, "A", conn, a);
                CreateDoorEndpointObject(grid, settings, doorRoot.transform, "B", conn, b);
            }

            EditorUtility.SetDirty(root);
            AssetDatabase.SaveAssets();
        }

        private static GameObject GetOrCreateRoot(string name)
        {
            var existing = GameObject.Find(name);
            if (existing != null) return existing;
            return new GameObject(name);
        }

        private static void ClearChildrenImmediate(Transform root)
        {
            for (var i = root.childCount - 1; i >= 0; i--)
            {
                var child = root.GetChild(i);
                UnityEngine.Object.DestroyImmediate(child.gameObject);
            }
        }

        private static GameObject CreateDoorLinkRoot(Transform parent, GameObject prefab, int fromId, int toId)
        {
            if (prefab != null)
            {
                var inst = (GameObject)PrefabUtility.InstantiatePrefab(prefab, parent);
                inst.name = $"Door_{fromId}_{toId}";
                return inst;
            }

            var go = new GameObject($"Door_{fromId}_{toId}");
            go.transform.SetParent(parent, false);
            return go;
        }

        private static void CreateDoorEndpointObject(
            Grid grid,
            MapmateImportSettings settings,
            Transform doorRoot,
            string name,
            MapmateUnityExportV1.Connection conn,
            MapmateConnectionEndpoints.Endpoint epInfo)
        {
            var go = new GameObject(name);
            go.transform.SetParent(doorRoot, false);
            go.transform.position = ToWorld(grid, epInfo.WorldTileX, epInfo.WorldTileY, settings.zLayerLinks, settings.placeAtCellCenter);

            var ep = go.GetComponent<MapmateLinkEndpoint>();
            if (ep == null) ep = go.AddComponent<MapmateLinkEndpoint>();

            ep.linkType = MapmateLinkType.Door;
            ep.fromRoomId = conn.fromId;
            ep.toRoomId = conn.toId;
            ep.condition = conn.condition;
            ep.roomId = epInfo.RoomId;
            ep.worldTile = new Vector2Int(epInfo.WorldTileX, epInfo.WorldTileY);
            ep.facing = ParseFacing(epInfo.Facing);

            if (settings.addDoorEndpointBoxCollider2D)
            {
                MapmateColliderUtil.EnsureBoxCollider2D(go, settings.doorEndpointColliderSize, settings.doorEndpointColliderIsTrigger);
            }

            if (settings.addDoorEndpointTriggerComponent)
            {
                if (go.GetComponent<MapmateDoorTrigger>() == null)
                    go.AddComponent<MapmateDoorTrigger>();
            }

            if (settings.addDoorEndpointAutoTransition2D)
            {
                if (go.GetComponent<MapmateDoorAutoTransition2D>() == null)
                    go.AddComponent<MapmateDoorAutoTransition2D>();
            }
        }

        private static Vector3 ToWorld(Grid grid, int tileX, int tileY, float z, bool placeAtCellCenter)
        {
            var cell = new Vector3Int(tileX, tileY, 0);
            var pos = placeAtCellCenter ? grid.GetCellCenterWorld(cell) : grid.CellToWorld(cell);
            pos.z = z;
            return pos;
        }

        private static MapmateFacing ParseFacing(string facing)
        {
            if (string.Equals(facing, "UP", StringComparison.OrdinalIgnoreCase)) return MapmateFacing.Up;
            if (string.Equals(facing, "DOWN", StringComparison.OrdinalIgnoreCase)) return MapmateFacing.Down;
            if (string.Equals(facing, "LEFT", StringComparison.OrdinalIgnoreCase)) return MapmateFacing.Left;
            if (string.Equals(facing, "RIGHT", StringComparison.OrdinalIgnoreCase)) return MapmateFacing.Right;
            return MapmateFacing.Right;
        }
    }
}

