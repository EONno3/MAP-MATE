using NUnit.Framework;
using UnityEngine;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateBasicDoorTransitionHandler2DTests
    {
        [Test]
        public void Teleports_Player_To_Destination_Room_SpawnPoint_When_Present()
        {
            var player = new GameObject("Player");
            player.tag = "Player";
            player.AddComponent<Rigidbody2D>();
            var playerCol = player.AddComponent<BoxCollider2D>();

            var sp1Go = new GameObject("Spawn_1");
            var sp1 = sp1Go.AddComponent<MapmateSpawnPoint>();
            sp1.roomId = 1;
            sp1Go.transform.position = new Vector3(1f, 2f, 0f);

            var sp2Go = new GameObject("Spawn_2");
            var sp2 = sp2Go.AddComponent<MapmateSpawnPoint>();
            sp2.roomId = 2;
            sp2Go.transform.position = new Vector3(10f, 20f, 0f);

            var handlerGo = new GameObject("Handler");
            var handler = handlerGo.AddComponent<MapmateBasicDoorTransitionHandler2D>();

            var req = new MapmateDoorTransitionRequest(
                fromRoomId: 1,
                toRoomId: 2,
                endpointRoomId: 1,
                destinationRoomId: 2,
                condition: "none",
                worldTile: new Vector2Int(0, 0),
                facing: MapmateFacing.Right);

            handler.HandleDoorTransition(req, playerCol);
            Assert.AreEqual(sp2Go.transform.position.x, player.transform.position.x, 0.0001f);
            Assert.AreEqual(sp2Go.transform.position.y, player.transform.position.y, 0.0001f);
        }
    }
}

