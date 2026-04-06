using NUnit.Framework;
using UnityEngine;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateDoorAutoTransition2DTests
    {
        [Test]
        public void AutoTransition_Resolves_Handler_From_Scene_When_Field_Is_Empty()
        {
            var player = new GameObject("Player");
            player.tag = "Player";
            player.AddComponent<Rigidbody2D>();
            var playerCol = player.AddComponent<BoxCollider2D>();

            var sp2Go = new GameObject("Spawn_2");
            var sp2 = sp2Go.AddComponent<MapmateSpawnPoint>();
            sp2.roomId = 2;
            sp2Go.transform.position = new Vector3(10f, 20f, 0f);

            var handlerGo = new GameObject("Handler");
            handlerGo.AddComponent<MapmateBasicDoorTransitionHandler2D>();

            var endpointGo = new GameObject("Endpoint");
            var ep = endpointGo.AddComponent<MapmateLinkEndpoint>();
            ep.linkType = MapmateLinkType.Door;
            ep.fromRoomId = 1;
            ep.toRoomId = 2;
            ep.condition = "none";
            ep.roomId = 1;
            ep.worldTile = new Vector2Int(0, 0);
            ep.facing = MapmateFacing.Right;
            endpointGo.AddComponent<BoxCollider2D>().isTrigger = true;
            endpointGo.AddComponent<MapmateDoorAutoTransition2D>();

            // 물리 이벤트를 기다리지 않고 메시지로 직접 호출(핸들러 탐색/요청 생성 로직 검증)
            endpointGo.SendMessage("OnTriggerEnter2D", playerCol);

            Assert.AreEqual(sp2Go.transform.position.x, player.transform.position.x, 0.0001f);
            Assert.AreEqual(sp2Go.transform.position.y, player.transform.position.y, 0.0001f);
        }
    }
}

