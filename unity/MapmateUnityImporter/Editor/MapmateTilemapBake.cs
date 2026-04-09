using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateTilemapBake
    {
        private static bool HasPrefix(string text, string prefix)
        {
            return text != null && prefix != null && text.StartsWith(prefix, StringComparison.Ordinal);
        }

        private static string ReplacePrefix(string text, string fromPrefix, string toPrefix)
        {
            if (string.IsNullOrEmpty(text) || string.IsNullOrEmpty(fromPrefix) || toPrefix == null) return text;
            if (!text.StartsWith(fromPrefix, StringComparison.Ordinal)) return text;
            return toPrefix + text.Substring(fromPrefix.Length);
        }

        public static void CopyAllTiles(Tilemap source, Tilemap destination, bool overwriteDestination)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (destination == null) throw new ArgumentNullException(nameof(destination));

            source.CompressBounds();
            var bounds = source.cellBounds;

            if (overwriteDestination)
            {
                destination.ClearAllTiles();
            }

            for (var y = bounds.yMin; y < bounds.yMax; y++)
            for (var x = bounds.xMin; x < bounds.xMax; x++)
            {
                var pos = new Vector3Int(x, y, 0);
                var tile = source.GetTile(pos);
                if (tile == null) continue;

                if (!overwriteDestination && destination.GetTile(pos) != null) continue;

                destination.SetTile(pos, tile);
                destination.SetColor(pos, source.GetColor(pos));
                destination.SetTransformMatrix(pos, source.GetTransformMatrix(pos));
            }
        }

        public static void BakeAutoToUserTilemaps(Transform mapRoot, bool clearAutoAfterBake, bool overwriteUserTiles)
        {
            if (mapRoot == null) throw new ArgumentNullException(nameof(mapRoot));

            // Supports both layouts:
            // - Combined: Grid/(AutoTilemap, UserTilemap)
            // - PerRoom: Grid/Rooms/(AutoRooms, UserRooms)/Room_x/(AutoTilemap, UserTilemap)

            var grid = FindChild(mapRoot, "Grid");
            if (grid == null) return;

            // Combined layout (optional)
            BakeInContainer(
                container: grid,
                autoBaseName: "AutoTilemap",
                userBaseName: "UserTilemap",
                clearAutoAfterBake: clearAutoAfterBake,
                overwriteUserTiles: overwriteUserTiles);

            // PerRoom layout
            var rooms = FindChild(grid, "Rooms");
            if (rooms == null) return;

            var autoRooms = FindChild(rooms, "AutoRooms");
            var userRooms = FindChild(rooms, "UserRooms");
            if (autoRooms == null || userRooms == null) return;

            var autoRoomRoots = new List<Transform>();
            for (var i = 0; i < autoRooms.childCount; i++)
            {
                var child = autoRooms.GetChild(i);
                if (child == null) continue;
                autoRoomRoots.Add(child);
            }

            foreach (var autoRoom in autoRoomRoots)
            {
                var roomName = autoRoom.name;
                var userRoom = FindChild(userRooms, roomName) ?? CreateChild(userRooms, roomName);
                BakeInContainer(
                    container: autoRoom,
                    userContainerOverride: userRoom,
                    autoBaseName: "AutoTilemap",
                    userBaseName: "UserTilemap",
                    clearAutoAfterBake: clearAutoAfterBake,
                    overwriteUserTiles: overwriteUserTiles);
            }
        }

        private static void BakeInContainer(
            Transform container,
            string autoBaseName,
            string userBaseName,
            bool clearAutoAfterBake,
            bool overwriteUserTiles)
        {
            BakeInContainer(container, userContainerOverride: container, autoBaseName, userBaseName, clearAutoAfterBake, overwriteUserTiles);
        }

        private static void BakeInContainer(
            Transform container,
            Transform userContainerOverride,
            string autoBaseName,
            string userBaseName,
            bool clearAutoAfterBake,
            bool overwriteUserTiles)
        {
            if (container == null || userContainerOverride == null) return;

            var autoTilemaps = new List<(Transform t, Tilemap tm)>();
            for (var i = 0; i < container.childCount; i++)
            {
                var child = container.GetChild(i);
                if (child == null) continue;
                if (!HasPrefix(child.name, autoBaseName)) continue;
                var tm = child.GetComponent<Tilemap>();
                if (tm == null) continue;
                autoTilemaps.Add((child, tm));
            }

            for (var i = 0; i < autoTilemaps.Count; i++)
            {
                var (autoT, autoTm) = autoTilemaps[i];
                var userName = ReplacePrefix(autoT.name, autoBaseName, userBaseName);
                var userT = FindChild(userContainerOverride, userName);
                var created = false;
                if (userT == null)
                {
                    userT = CreateTilemapChild(userContainerOverride, userName);
                    created = true;
                }

                var userTm = userT.GetComponent<Tilemap>();
                if (userTm == null) userTm = userT.gameObject.AddComponent<Tilemap>();
                if (userT.GetComponent<TilemapRenderer>() == null) userT.gameObject.AddComponent<TilemapRenderer>();

                if (created)
                {
                    userT.localPosition = autoT.localPosition;
                    userT.localRotation = autoT.localRotation;
                    userT.localScale = autoT.localScale;
                }

                EnsurePhysicsLikeSource(autoT.gameObject, userT.gameObject);
                CopyAllTiles(autoTm, userTm, overwriteUserTiles);
                if (clearAutoAfterBake) autoTm.ClearAllTiles();
            }
        }

        private static void EnsurePhysicsLikeSource(GameObject sourceTilemapGo, GameObject destinationTilemapGo)
        {
            if (sourceTilemapGo == null || destinationTilemapGo == null) return;

            var srcTileCol = sourceTilemapGo.GetComponent<TilemapCollider2D>();
            if (srcTileCol != null)
            {
                var dstTileCol = destinationTilemapGo.GetComponent<TilemapCollider2D>();
                if (dstTileCol == null) dstTileCol = destinationTilemapGo.AddComponent<TilemapCollider2D>();
                dstTileCol.usedByComposite = srcTileCol.usedByComposite;
                dstTileCol.isTrigger = srcTileCol.isTrigger;
                dstTileCol.usedByEffector = srcTileCol.usedByEffector;
            }

            var srcComposite = sourceTilemapGo.GetComponent<CompositeCollider2D>();
            if (srcComposite != null)
            {
                if (destinationTilemapGo.GetComponent<CompositeCollider2D>() == null)
                {
                    destinationTilemapGo.AddComponent<CompositeCollider2D>();
                }

                var dstRb = destinationTilemapGo.GetComponent<Rigidbody2D>();
                if (dstRb == null) dstRb = destinationTilemapGo.AddComponent<Rigidbody2D>();
                dstRb.bodyType = RigidbodyType2D.Static;
            }

            var srcEffector = sourceTilemapGo.GetComponent<PlatformEffector2D>();
            if (srcEffector != null)
            {
                var dstEffector = destinationTilemapGo.GetComponent<PlatformEffector2D>();
                if (dstEffector == null) dstEffector = destinationTilemapGo.AddComponent<PlatformEffector2D>();
                dstEffector.useOneWay = srcEffector.useOneWay;
                dstEffector.useSideFriction = srcEffector.useSideFriction;
                dstEffector.surfaceArc = srcEffector.surfaceArc;
                dstEffector.sideArc = srcEffector.sideArc;
                dstEffector.rotationalOffset = srcEffector.rotationalOffset;
            }
        }

        private static Transform FindChild(Transform parent, string name)
        {
            if (parent == null) return null;
            if (string.IsNullOrEmpty(name)) return null;
            return parent.Find(name);
        }

        private static Transform CreateChild(Transform parent, string name)
        {
            var go = new GameObject(string.IsNullOrEmpty(name) ? "Unnamed" : name);
            go.transform.SetParent(parent, false);
            return go.transform;
        }

        private static Transform CreateTilemapChild(Transform parent, string name)
        {
            var go = new GameObject(string.IsNullOrEmpty(name) ? "Tilemap" : name);
            go.transform.SetParent(parent, false);
            go.AddComponent<Tilemap>();
            go.AddComponent<TilemapRenderer>();
            return go.transform;
        }
    }
}

