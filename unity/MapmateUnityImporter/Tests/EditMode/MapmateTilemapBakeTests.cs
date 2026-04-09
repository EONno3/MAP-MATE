using NUnit.Framework;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateTilemapBakeTests
    {
        [Test]
        public void CopyAllTiles_OverwriteDestination_CopiesTiles()
        {
            var gridGo = new GameObject("Grid");
            gridGo.AddComponent<Grid>();

            var autoGo = new GameObject("AutoTilemap");
            autoGo.transform.SetParent(gridGo.transform, false);
            var auto = autoGo.AddComponent<Tilemap>();
            autoGo.AddComponent<TilemapRenderer>();

            var userGo = new GameObject("UserTilemap");
            userGo.transform.SetParent(gridGo.transform, false);
            var user = userGo.AddComponent<Tilemap>();
            userGo.AddComponent<TilemapRenderer>();

            var tileA = ScriptableObject.CreateInstance<Tile>();
            var tileB = ScriptableObject.CreateInstance<Tile>();
            auto.SetTile(new Vector3Int(0, 0, 0), tileA);
            auto.SetTile(new Vector3Int(2, 3, 0), tileB);

            user.SetTile(new Vector3Int(0, 0, 0), tileB); // will be overwritten

            try
            {
                MapmateTilemapBake.CopyAllTiles(auto, user, overwriteDestination: true);

                Assert.AreSame(tileA, user.GetTile(new Vector3Int(0, 0, 0)));
                Assert.AreSame(tileB, user.GetTile(new Vector3Int(2, 3, 0)));
            }
            finally
            {
                Object.DestroyImmediate(tileA);
                Object.DestroyImmediate(tileB);
                Object.DestroyImmediate(gridGo);
            }
        }

        [Test]
        public void CopyAllTiles_Merge_DoesNotOverwriteExistingTiles()
        {
            var gridGo = new GameObject("Grid");
            gridGo.AddComponent<Grid>();

            var autoGo = new GameObject("AutoTilemap");
            autoGo.transform.SetParent(gridGo.transform, false);
            var auto = autoGo.AddComponent<Tilemap>();
            autoGo.AddComponent<TilemapRenderer>();

            var userGo = new GameObject("UserTilemap");
            userGo.transform.SetParent(gridGo.transform, false);
            var user = userGo.AddComponent<Tilemap>();
            userGo.AddComponent<TilemapRenderer>();

            var srcTile = ScriptableObject.CreateInstance<Tile>();
            var dstTile = ScriptableObject.CreateInstance<Tile>();
            auto.SetTile(new Vector3Int(0, 0, 0), srcTile);
            user.SetTile(new Vector3Int(0, 0, 0), dstTile);

            try
            {
                MapmateTilemapBake.CopyAllTiles(auto, user, overwriteDestination: false);
                Assert.AreSame(dstTile, user.GetTile(new Vector3Int(0, 0, 0)));
            }
            finally
            {
                Object.DestroyImmediate(srcTile);
                Object.DestroyImmediate(dstTile);
                Object.DestroyImmediate(gridGo);
            }
        }

        [Test]
        public void BakeAutoIntoUser_AndClearAuto_ClearsSourceTiles()
        {
            var root = new GameObject("MapmateMapRoot");

            var gridGo = new GameObject("Grid");
            gridGo.transform.SetParent(root.transform, false);
            gridGo.AddComponent<Grid>();

            var roomsGo = new GameObject("Rooms");
            roomsGo.transform.SetParent(gridGo.transform, false);

            var autoRooms = new GameObject("AutoRooms");
            autoRooms.transform.SetParent(roomsGo.transform, false);

            var userRooms = new GameObject("UserRooms");
            userRooms.transform.SetParent(roomsGo.transform, false);

            var autoRoom = new GameObject("Room_1");
            autoRoom.transform.SetParent(autoRooms.transform, false);

            var userRoom = new GameObject("Room_1");
            userRoom.transform.SetParent(userRooms.transform, false);

            var autoTilemapGo = new GameObject("AutoTilemap");
            autoTilemapGo.transform.SetParent(autoRoom.transform, false);
            var auto = autoTilemapGo.AddComponent<Tilemap>();
            autoTilemapGo.AddComponent<TilemapRenderer>();

            var userTilemapGo = new GameObject("UserTilemap");
            userTilemapGo.transform.SetParent(userRoom.transform, false);
            var user = userTilemapGo.AddComponent<Tilemap>();
            userTilemapGo.AddComponent<TilemapRenderer>();

            var tile = ScriptableObject.CreateInstance<Tile>();
            auto.SetTile(new Vector3Int(1, 2, 0), tile);

            try
            {
                MapmateTilemapBake.BakeAutoToUserTilemaps(root.transform, clearAutoAfterBake: true, overwriteUserTiles: true);

                Assert.AreSame(tile, user.GetTile(new Vector3Int(1, 2, 0)));
                Assert.IsNull(auto.GetTile(new Vector3Int(1, 2, 0)));
            }
            finally
            {
                Object.DestroyImmediate(tile);
                Object.DestroyImmediate(root);
            }
        }

        [Test]
        public void BakeAutoIntoUser_Copies_Physics_Components_When_Present_On_Source()
        {
            var root = new GameObject("MapmateMapRoot");
            var gridGo = new GameObject("Grid");
            gridGo.transform.SetParent(root.transform, false);
            gridGo.AddComponent<Grid>();

            var roomsGo = new GameObject("Rooms");
            roomsGo.transform.SetParent(gridGo.transform, false);

            var autoRooms = new GameObject("AutoRooms");
            autoRooms.transform.SetParent(roomsGo.transform, false);
            var userRooms = new GameObject("UserRooms");
            userRooms.transform.SetParent(roomsGo.transform, false);

            var autoRoom = new GameObject("Room_1");
            autoRoom.transform.SetParent(autoRooms.transform, false);
            var userRoom = new GameObject("Room_1");
            userRoom.transform.SetParent(userRooms.transform, false);

            var autoTilemapGo = new GameObject("AutoTilemap");
            autoTilemapGo.transform.SetParent(autoRoom.transform, false);
            var auto = autoTilemapGo.AddComponent<Tilemap>();
            autoTilemapGo.AddComponent<TilemapRenderer>();

            var tileCol = autoTilemapGo.AddComponent<TilemapCollider2D>();
            tileCol.usedByComposite = true;
            autoTilemapGo.AddComponent<CompositeCollider2D>();
            var rb = autoTilemapGo.AddComponent<Rigidbody2D>();
            rb.bodyType = RigidbodyType2D.Static;

            var userTilemapGo = new GameObject("UserTilemap");
            userTilemapGo.transform.SetParent(userRoom.transform, false);
            userTilemapGo.AddComponent<Tilemap>();
            userTilemapGo.AddComponent<TilemapRenderer>();

            try
            {
                MapmateTilemapBake.BakeAutoToUserTilemaps(root.transform, clearAutoAfterBake: false, overwriteUserTiles: true);

                Assert.IsNotNull(userTilemapGo.GetComponent<TilemapCollider2D>());
                Assert.IsNotNull(userTilemapGo.GetComponent<CompositeCollider2D>());
                var userRb = userTilemapGo.GetComponent<Rigidbody2D>();
                Assert.IsNotNull(userRb);
                Assert.AreEqual(RigidbodyType2D.Static, userRb.bodyType);
            }
            finally
            {
                Object.DestroyImmediate(root);
            }
        }

        [Test]
        public void BakeAutoIntoUser_When_UserTilemap_Missing_Creates_And_Matches_LocalTransform()
        {
            var root = new GameObject("MapmateMapRoot");

            var gridGo = new GameObject("Grid");
            gridGo.transform.SetParent(root.transform, false);
            gridGo.AddComponent<Grid>();

            var roomsGo = new GameObject("Rooms");
            roomsGo.transform.SetParent(gridGo.transform, false);

            var autoRooms = new GameObject("AutoRooms");
            autoRooms.transform.SetParent(roomsGo.transform, false);

            var userRooms = new GameObject("UserRooms");
            userRooms.transform.SetParent(roomsGo.transform, false);

            var autoRoom = new GameObject("Room_1");
            autoRoom.transform.SetParent(autoRooms.transform, false);

            var userRoom = new GameObject("Room_1");
            userRoom.transform.SetParent(userRooms.transform, false);

            var autoTilemapGo = new GameObject("AutoTilemap");
            autoTilemapGo.transform.SetParent(autoRoom.transform, false);
            autoTilemapGo.transform.localPosition = new Vector3(12f, 34f, 0f);
            autoTilemapGo.transform.localRotation = Quaternion.Euler(0f, 0f, 15f);
            autoTilemapGo.transform.localScale = new Vector3(1.25f, 0.75f, 1f);
            autoTilemapGo.AddComponent<Tilemap>();
            autoTilemapGo.AddComponent<TilemapRenderer>();

            try
            {
                MapmateTilemapBake.BakeAutoToUserTilemaps(root.transform, clearAutoAfterBake: false, overwriteUserTiles: false);

                var createdUser = userRoom.transform.Find("UserTilemap");
                Assert.IsNotNull(createdUser);
                Assert.AreEqual(autoTilemapGo.transform.localPosition, createdUser.localPosition);
                Assert.AreEqual(autoTilemapGo.transform.localRotation, createdUser.localRotation);
                Assert.AreEqual(autoTilemapGo.transform.localScale, createdUser.localScale);
            }
            finally
            {
                Object.DestroyImmediate(root);
            }
        }
    }
}

