using NUnit.Framework;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateImportGuardTests
    {
        [Test]
        public void ComputeSha256Hex_IsStable()
        {
            var hex = MapmateImportHash.ComputeSha256Hex("abc");
            Assert.AreEqual("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", hex);
        }

        [Test]
        public void HasAnyUserTileEdits_ReturnsTrue_When_UserTilemap_Has_Tiles()
        {
            var root = new GameObject("MapmateMapRoot");
            var gridGo = new GameObject("Grid");
            gridGo.transform.SetParent(root.transform, false);
            gridGo.AddComponent<Grid>();

            var roomsGo = new GameObject("Rooms");
            roomsGo.transform.SetParent(gridGo.transform, false);

            var userRooms = new GameObject("UserRooms");
            userRooms.transform.SetParent(roomsGo.transform, false);

            var userRoom = new GameObject("Room_1");
            userRoom.transform.SetParent(userRooms.transform, false);

            var userTilemapGo = new GameObject("UserTilemap");
            userTilemapGo.transform.SetParent(userRoom.transform, false);
            var tm = userTilemapGo.AddComponent<Tilemap>();
            userTilemapGo.AddComponent<TilemapRenderer>();

            var tile = ScriptableObject.CreateInstance<Tile>();
            tm.SetTile(new Vector3Int(0, 0, 0), tile);

            try
            {
                Assert.IsTrue(MapmateImportGuard.HasAnyUserTileEdits(root.transform));
            }
            finally
            {
                Object.DestroyImmediate(tile);
                Object.DestroyImmediate(root);
            }
        }
    }
}

