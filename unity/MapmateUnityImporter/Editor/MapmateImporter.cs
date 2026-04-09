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
        private enum MapmateTileLayer
        {
            Ground = 0,
            OneWay = 1,
            Hazard = 2,
            Deco = 3,
        }

        private static string GetLayerSuffix(MapmateTileLayer layer)
        {
            if (layer == MapmateTileLayer.Ground) return string.Empty;
            if (layer == MapmateTileLayer.OneWay) return "_OneWay";
            if (layer == MapmateTileLayer.Hazard) return "_Hazard";
            return "_Deco";
        }

        private static MapmateTileLayer GetDefaultLayerForTileId(int tileId)
        {
            // Default mapping (MapmateAutoSetup 기준):
            // 1 solid, 2 platform, 3 spike, 4 acid, 5 breakable, 6 door
            if (tileId == 2) return MapmateTileLayer.OneWay;
            if (tileId == 3 || tileId == 4) return MapmateTileLayer.Hazard;
            if (tileId == 6) return MapmateTileLayer.Deco;
            return MapmateTileLayer.Ground;
        }

        private static GameObject GetOrCreateLayeredTilemapGo(
            Transform parent,
            string baseName,
            MapmateTileLayer layer,
            Vector3 localPosition)
        {
            var name = baseName + GetLayerSuffix(layer);
            var go = GetOrCreateChildGo(parent, name);
            go.transform.localPosition = localPosition;
            if (go.GetComponent<Tilemap>() == null) go.AddComponent<Tilemap>();
            if (go.GetComponent<TilemapRenderer>() == null) go.AddComponent<TilemapRenderer>();
            return go;
        }

        private static void EnsureLayerPhysics(GameObject tilemapGo, MapmateImportSettings settings, MapmateTileLayer layer)
        {
            if (tilemapGo == null || settings == null) return;

            if (layer == MapmateTileLayer.Ground)
            {
                EnsureTilemapPhysics(tilemapGo, settings);
                return;
            }

            if (layer == MapmateTileLayer.Deco)
            {
                // Visual only by default
                return;
            }

            if (layer == MapmateTileLayer.Hazard)
            {
                var col = tilemapGo.GetComponent<TilemapCollider2D>();
                if (col == null) col = tilemapGo.AddComponent<TilemapCollider2D>();
                col.isTrigger = true;
                col.usedByComposite = false;
                return;
            }

            // OneWay
            var oneWayCol = tilemapGo.GetComponent<TilemapCollider2D>();
            if (oneWayCol == null) oneWayCol = tilemapGo.AddComponent<TilemapCollider2D>();
            oneWayCol.isTrigger = false;
            oneWayCol.usedByComposite = false;
            oneWayCol.usedByEffector = true;

            var eff = tilemapGo.GetComponent<PlatformEffector2D>();
            if (eff == null) eff = tilemapGo.AddComponent<PlatformEffector2D>();
            eff.useOneWay = true;
            eff.useSideFriction = false;
        }

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
            var overwriteAll = settings.clearExistingChildren || settings.reimportMode == MapmateReimportMode.OverwriteAll;
            if (overwriteAll) ClearChildrenImmediate(root.transform);

            var autoRoot = GetOrCreateChild(root.transform, settings.autoRootName);
            var userRoot = GetOrCreateChild(root.transform, settings.userRootName);
            if (!overwriteAll)
            {
                // 기본값: Auto만 갱신하고 User 편집은 유지
                ClearChildrenImmediate(autoRoot);
            }

            // Grid
            var gridGo = GetOrCreateChildGo(root.transform, settings.gridName);
            var grid = gridGo.GetComponent<Grid>();
            if (grid == null) grid = gridGo.AddComponent<Grid>();
            grid.cellSize = new Vector3(settings.unitsPerTile, settings.unitsPerTile, 0f);

            // Rooms Tilemaps (Grid 하위) - 편집 친화: PerRoom이 기본
            var roomsRootOnGrid = GetOrCreateChildGo(gridGo.transform, settings.roomsRootName);
            var autoRoomsRootOnGrid = GetOrCreateChildGo(roomsRootOnGrid.transform, settings.autoRoomsRootName);
            var userRoomsRootOnGrid = GetOrCreateChildGo(roomsRootOnGrid.transform, settings.userRoomsRootName);
            if (!overwriteAll)
            {
                // Auto 룸 타일맵만 갱신하고 User 룸 타일맵은 유지
                ClearChildrenImmediate(autoRoomsRootOnGrid.transform);
            }

            // Rooms (메타/오브젝트 그룹핑)
            var roomsById = new Dictionary<int, MapmateUnityExportV1.Room>();
            var roomsRoot = new GameObject("Rooms");
            roomsRoot.transform.SetParent(autoRoot, false);

            // Combined(레거시/옵션) 타일맵
            Tilemap combinedAutoTilemap = null;
            Tilemap combinedAutoOneWay = null;
            Tilemap combinedAutoHazard = null;
            Tilemap combinedAutoDeco = null;
            if (settings.tilemapLayout == MapmateTilemapLayout.Combined)
            {
                var basePos = new Vector3(0f, 0f, settings.zLayerTiles);
                var autoGroundGo = GetOrCreateLayeredTilemapGo(gridGo.transform, settings.autoTilemapName, MapmateTileLayer.Ground, basePos);
                combinedAutoTilemap = autoGroundGo.GetComponent<Tilemap>();
                EnsureLayerPhysics(autoGroundGo, settings, MapmateTileLayer.Ground);

                if (settings.useLayeredTilemaps)
                {
                    var autoOneWayGo = GetOrCreateLayeredTilemapGo(gridGo.transform, settings.autoTilemapName, MapmateTileLayer.OneWay, basePos);
                    var autoHazardGo = GetOrCreateLayeredTilemapGo(gridGo.transform, settings.autoTilemapName, MapmateTileLayer.Hazard, basePos);
                    var autoDecoGo = GetOrCreateLayeredTilemapGo(gridGo.transform, settings.autoTilemapName, MapmateTileLayer.Deco, basePos);
                    combinedAutoOneWay = autoOneWayGo.GetComponent<Tilemap>();
                    combinedAutoHazard = autoHazardGo.GetComponent<Tilemap>();
                    combinedAutoDeco = autoDecoGo.GetComponent<Tilemap>();

                    EnsureLayerPhysics(autoOneWayGo, settings, MapmateTileLayer.OneWay);
                    EnsureLayerPhysics(autoHazardGo, settings, MapmateTileLayer.Hazard);
                    EnsureLayerPhysics(autoDecoGo, settings, MapmateTileLayer.Deco);
                }

                if (settings.importTilesIntoAutoTilemaps)
                {
                    combinedAutoTilemap.ClearAllTiles();
                    combinedAutoOneWay?.ClearAllTiles();
                    combinedAutoHazard?.ClearAllTiles();
                    combinedAutoDeco?.ClearAllTiles();
                }

                var userTilemapGo = GetOrCreateChildGo(gridGo.transform, settings.userTilemapName);
                userTilemapGo.transform.localPosition = new Vector3(0f, 0f, settings.zLayerTiles);
                if (userTilemapGo.GetComponent<Tilemap>() == null) userTilemapGo.AddComponent<Tilemap>();
                if (userTilemapGo.GetComponent<TilemapRenderer>() == null) userTilemapGo.AddComponent<TilemapRenderer>();
                EnsureTilemapPhysics(userTilemapGo, settings);
            }

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

                Tilemap roomAutoTilemap = null;
                Tilemap roomAutoOneWay = null;
                Tilemap roomAutoHazard = null;
                Tilemap roomAutoDeco = null;
                if (settings.tilemapLayout == MapmateTilemapLayout.PerRoom)
                {
                    var roomAutoRoot = GetOrCreateChildGo(autoRoomsRootOnGrid.transform, $"Room_{room.id}");
                    var roomUserRoot = GetOrCreateChildGo(userRoomsRootOnGrid.transform, $"Room_{room.id}");

                    // AutoTilemap
                    var roomOriginLocal = RoomOriginLocal(gridGo.transform, grid, originX, originY, settings.zLayerTiles);
                    var roomAutoGroundGo = GetOrCreateLayeredTilemapGo(roomAutoRoot.transform, settings.autoTilemapName, MapmateTileLayer.Ground, roomOriginLocal);
                    roomAutoTilemap = roomAutoGroundGo.GetComponent<Tilemap>();
                    EnsureLayerPhysics(roomAutoGroundGo, settings, MapmateTileLayer.Ground);

                    if (settings.useLayeredTilemaps)
                    {
                        var roomAutoOneWayGo = GetOrCreateLayeredTilemapGo(roomAutoRoot.transform, settings.autoTilemapName, MapmateTileLayer.OneWay, roomOriginLocal);
                        var roomAutoHazardGo = GetOrCreateLayeredTilemapGo(roomAutoRoot.transform, settings.autoTilemapName, MapmateTileLayer.Hazard, roomOriginLocal);
                        var roomAutoDecoGo = GetOrCreateLayeredTilemapGo(roomAutoRoot.transform, settings.autoTilemapName, MapmateTileLayer.Deco, roomOriginLocal);
                        roomAutoOneWay = roomAutoOneWayGo.GetComponent<Tilemap>();
                        roomAutoHazard = roomAutoHazardGo.GetComponent<Tilemap>();
                        roomAutoDeco = roomAutoDecoGo.GetComponent<Tilemap>();

                        EnsureLayerPhysics(roomAutoOneWayGo, settings, MapmateTileLayer.OneWay);
                        EnsureLayerPhysics(roomAutoHazardGo, settings, MapmateTileLayer.Hazard);
                        EnsureLayerPhysics(roomAutoDecoGo, settings, MapmateTileLayer.Deco);
                    }

                    if (settings.importTilesIntoAutoTilemaps)
                    {
                        roomAutoTilemap.ClearAllTiles();
                        roomAutoOneWay?.ClearAllTiles();
                        roomAutoHazard?.ClearAllTiles();
                        roomAutoDeco?.ClearAllTiles();
                    }

                    // UserTilemap (유지)
                    var roomUserTilemapGo = GetOrCreateChildGo(roomUserRoot.transform, settings.userTilemapName);
                    roomUserTilemapGo.transform.localPosition = roomOriginLocal;
                    if (roomUserTilemapGo.GetComponent<Tilemap>() == null) roomUserTilemapGo.AddComponent<Tilemap>();
                    if (roomUserTilemapGo.GetComponent<TilemapRenderer>() == null) roomUserTilemapGo.AddComponent<TilemapRenderer>();
                    EnsureTilemapPhysics(roomUserTilemapGo, settings);
                }

                for (var y = 0; y < detail.tileHeight; y++)
                for (var x = 0; x < detail.tileWidth; x++)
                {
                    if (!settings.importTilesIntoAutoTilemaps) continue;
                    var tileId = tiles[y, x];
                    if (tileId == 0) continue; // empty
                    if (!tilePaletteAsset.TryGetTileById(tileId, out var tile)) continue;

                    if (settings.useLayeredTilemaps)
                    {
                        var layer = GetDefaultLayerForTileId(tileId);
                        if (settings.tilemapLayout == MapmateTilemapLayout.Combined)
                        {
                            var dst = layer switch
                            {
                                MapmateTileLayer.Ground => combinedAutoTilemap,
                                MapmateTileLayer.OneWay => combinedAutoOneWay,
                                MapmateTileLayer.Hazard => combinedAutoHazard,
                                _ => combinedAutoDeco
                            };
                            dst?.SetTile(new Vector3Int(originX + x, originY + y, 0), tile);
                        }
                        else if (settings.tilemapLayout == MapmateTilemapLayout.PerRoom)
                        {
                            var dst = layer switch
                            {
                                MapmateTileLayer.Ground => roomAutoTilemap,
                                MapmateTileLayer.OneWay => roomAutoOneWay,
                                MapmateTileLayer.Hazard => roomAutoHazard,
                                _ => roomAutoDeco
                            };
                            dst?.SetTile(new Vector3Int(x, y, 0), tile);
                        }
                        continue;
                    }

                    if (settings.tilemapLayout == MapmateTilemapLayout.Combined && combinedAutoTilemap != null)
                    {
                        combinedAutoTilemap.SetTile(new Vector3Int(originX + x, originY + y, 0), tile);
                    }
                    else if (settings.tilemapLayout == MapmateTilemapLayout.PerRoom && roomAutoTilemap != null)
                    {
                        roomAutoTilemap.SetTile(new Vector3Int(x, y, 0), tile);
                    }
                }

                // objects
                var objsRoot = new GameObject("Objects");
                objsRoot.transform.SetParent(roomGo.transform, false);
                objsRoot.transform.localPosition = new Vector3(0f, 0f, settings.zLayerObjects);

                foreach (var obj in detail.objects ?? new List<MapmateUnityExportV1.RoomObject>())
                {
                    if (obj == null) continue;
                    var prefabKey = obj.key; // v1: key를 prefabKey로 사용(팔레트에서 매핑)
                    var worldPos = ToWorld(grid, originX + obj.x, originY + obj.y, settings.zLayerObjects, settings.placeAtCellCenter);
                    if (!prefabPaletteAsset.TryGetPrefab(prefabKey, out var prefab) || prefab == null)
                    {
                        // 매핑이 없으면 빈 오브젝트라도 생성해서 위치/키를 보존
                        var fallback = new GameObject($"Obj_{prefabKey}");
                        fallback.transform.SetParent(objsRoot.transform, false);
                        fallback.transform.position = worldPos;
                        TryAttachSpawnPoint(fallback, prefabKey, room.id);
                        continue;
                    }

                    var inst = (GameObject)PrefabUtility.InstantiatePrefab(prefab, objsRoot.transform);
                    inst.name = $"{prefabKey}_{room.id}_{obj.x}_{obj.y}";
                    inst.transform.position = worldPos;
                    TryAttachSpawnPoint(inst, prefabKey, room.id);
                }
            }

            // Connections
            var linksRoot = new GameObject(settings.linksRootName);
            linksRoot.transform.SetParent(autoRoot, false);

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

            EnsurePlaySetup(userRoot, grid, prefabPaletteAsset, settings);

            if (settings.logImportSummary)
            {
                Debug.Log($"[MapmateImporter] Imported rooms={roomsById.Count}, connections={(data.connections != null ? data.connections.Count : 0)}, layout={settings.tilemapLayout}");
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

        private static Transform GetOrCreateChild(Transform parent, string name)
        {
            return GetOrCreateChildGo(parent, name).transform;
        }

        private static GameObject GetOrCreateChildGo(Transform parent, string name)
        {
            if (parent == null) throw new ArgumentNullException(nameof(parent));
            if (string.IsNullOrEmpty(name)) name = "Unnamed";

            var t = parent.Find(name);
            if (t != null) return t.gameObject;
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            return go;
        }

        private static void ClearChildrenImmediate(Transform root)
        {
            for (var i = root.childCount - 1; i >= 0; i--)
            {
                var child = root.GetChild(i);
                UnityEngine.Object.DestroyImmediate(child.gameObject);
            }
        }

        private static void EnsureTilemapPhysics(GameObject tilemapGo, MapmateImportSettings settings)
        {
            if (tilemapGo == null || settings == null) return;
            if (!settings.addTilemapCollider2D) return;

            var tileCol = tilemapGo.GetComponent<TilemapCollider2D>();
            if (tileCol == null) tileCol = tilemapGo.AddComponent<TilemapCollider2D>();

            if (!settings.addCompositeCollider2D) return;
            tileCol.usedByComposite = true;

            var rb = tilemapGo.GetComponent<Rigidbody2D>();
            if (rb == null) rb = tilemapGo.AddComponent<Rigidbody2D>();
            rb.bodyType = RigidbodyType2D.Static;

            if (tilemapGo.GetComponent<CompositeCollider2D>() == null)
            {
                tilemapGo.AddComponent<CompositeCollider2D>();
            }
        }

        private static Vector3 RoomOriginLocal(Transform gridTransform, Grid grid, int originX, int originY, float z)
        {
            var cell = new Vector3Int(originX, originY, 0);
            var world = grid.CellToWorld(cell);
            var local = gridTransform.InverseTransformPoint(world);
            local.z = z;
            return local;
        }

        private static void TryAttachSpawnPoint(GameObject go, string prefabKey, int roomId)
        {
            if (go == null) return;
            if (!string.Equals(prefabKey, "spawn_point", StringComparison.OrdinalIgnoreCase)) return;
            var sp = go.GetComponent<MapmateSpawnPoint>();
            if (sp == null) sp = go.AddComponent<MapmateSpawnPoint>();
            sp.roomId = roomId;
        }

        private static void EnsurePlaySetup(Transform userRoot, Grid grid, MapmatePrefabPalette prefabPalette, MapmateImportSettings settings)
        {
            if (userRoot == null || settings == null) return;

            var gameplay = GetOrCreateChild(userRoot, "Gameplay");

            if (settings.ensureDefaultTransitionHandler)
            {
                if (UnityEngine.Object.FindObjectOfType<MapmateBasicDoorTransitionHandler2D>() == null)
                {
                    var handlerGo = new GameObject("MapmateTransitionHandler");
                    handlerGo.transform.SetParent(gameplay, false);
                    handlerGo.AddComponent<MapmateBasicDoorTransitionHandler2D>();
                }
            }

            Transform player = null;
            var existingPlayer = GameObject.FindGameObjectWithTag("Player");
            if (existingPlayer != null) player = existingPlayer.transform;

            if (player == null && !string.IsNullOrEmpty(settings.playerPrefabKey) && prefabPalette != null)
            {
                prefabPalette.TryGetPrefab(settings.playerPrefabKey, out var playerPrefab);
                if (playerPrefab != null)
                {
                    var inst = (GameObject)PrefabUtility.InstantiatePrefab(playerPrefab, gameplay);
                    inst.name = "Player";
                    inst.tag = "Player";
                    player = inst.transform;
                }
            }

            if (player == null)
            {
                // fallback: 최소 플레이어 생성
                var go = new GameObject("Player");
                go.transform.SetParent(gameplay, false);
                go.tag = "Player";
                go.AddComponent<Rigidbody2D>();
                go.AddComponent<BoxCollider2D>();
                go.AddComponent<MapmatePlayerController2D>();
                player = go.transform;
            }

            // spawn position
            var spawnPoints = UnityEngine.Object.FindObjectsOfType<MapmateSpawnPoint>();
            if (spawnPoints.Length > 0)
            {
                player.position = spawnPoints[0].transform.position;
            }

            if (settings.ensureCameraFollow)
            {
                var cam = Camera.main;
                var hasExisting = cam != null;
                if (hasExisting && !settings.configureExistingMainCamera)
                {
                    // 기존 카메라가 이미 있다면 기본값으로는 건드리지 않습니다.
                    return;
                }

                if (cam == null)
                {
                    var camGo = new GameObject("Main Camera");
                    camGo.tag = "MainCamera";
                    cam = camGo.AddComponent<Camera>();
                    cam.orthographic = true;
                    cam.orthographicSize = 6f;
                }

                var follow = cam.GetComponent<MapmateCameraFollow2D>();
                if (follow == null) follow = cam.gameObject.AddComponent<MapmateCameraFollow2D>();
                follow.SetTarget(player);
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

