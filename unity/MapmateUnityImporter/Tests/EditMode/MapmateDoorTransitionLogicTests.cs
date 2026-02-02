using NUnit.Framework;
using UnityEngine;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateDoorTransitionLogicTests
    {
        [Test]
        public void Builds_Request_With_Destination()
        {
            var ok = MapmateDoorTransitionLogic.TryBuildRequest(
                endpointRoomId: 1,
                fromRoomId: 1,
                toRoomId: 2,
                condition: "dash",
                worldTile: new Vector2Int(10, 20),
                facing: MapmateFacing.Right,
                out var req);

            Assert.IsTrue(ok);
            Assert.AreEqual(1, req.endpointRoomId);
            Assert.AreEqual(2, req.destinationRoomId);
            Assert.AreEqual("dash", req.condition);
            Assert.AreEqual(new Vector2Int(10, 20), req.worldTile);
            Assert.AreEqual(MapmateFacing.Right, req.facing);
        }

        [Test]
        public void Returns_False_When_Endpoint_Room_Invalid()
        {
            var ok = MapmateDoorTransitionLogic.TryBuildRequest(
                endpointRoomId: 999,
                fromRoomId: 1,
                toRoomId: 2,
                condition: null,
                worldTile: default,
                facing: MapmateFacing.Up,
                out var _);

            Assert.IsFalse(ok);
        }
    }
}

