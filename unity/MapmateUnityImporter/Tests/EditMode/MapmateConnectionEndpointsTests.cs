using NUnit.Framework;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateConnectionEndpointsTests
    {
        [Test]
        public void Prefers_Doorway_Endpoints_When_Present()
        {
            var conn = new MapmateUnityExportV1.Connection
            {
                fromId = 1,
                toId = 2,
                doorwayA = new MapmateUnityExportV1.Doorway { roomId = 1, worldTileX = 10, worldTileY = 20, facing = "RIGHT" },
                doorwayB = new MapmateUnityExportV1.Doorway { roomId = 2, worldTileX = 11, worldTileY = 20, facing = "LEFT" },
                portalA = new MapmateUnityExportV1.Doorway { roomId = 1, worldTileX = 999, worldTileY = 999, facing = "UP" },
                portalB = new MapmateUnityExportV1.Doorway { roomId = 2, worldTileX = 999, worldTileY = 999, facing = "DOWN" },
            };

            var ok = MapmateConnectionEndpoints.TryGetDoorEndpoints(conn, out var a, out var b);
            Assert.IsTrue(ok);
            Assert.AreEqual(10, a.WorldTileX);
            Assert.AreEqual(20, a.WorldTileY);
            Assert.AreEqual(11, b.WorldTileX);
            Assert.AreEqual(20, b.WorldTileY);
        }

        [Test]
        public void Falls_Back_To_Portal_Endpoints_When_Doorway_Missing()
        {
            var conn = new MapmateUnityExportV1.Connection
            {
                fromId = 1,
                toId = 2,
                portalA = new MapmateUnityExportV1.Doorway { roomId = 1, worldTileX = 100, worldTileY = 200, facing = "UP" },
                portalB = new MapmateUnityExportV1.Doorway { roomId = 2, worldTileX = 101, worldTileY = 200, facing = "DOWN" },
            };

            var ok = MapmateConnectionEndpoints.TryGetDoorEndpoints(conn, out var a, out var b);
            Assert.IsTrue(ok);
            Assert.AreEqual(100, a.WorldTileX);
            Assert.AreEqual(200, a.WorldTileY);
            Assert.AreEqual(101, b.WorldTileX);
            Assert.AreEqual(200, b.WorldTileY);
        }
    }
}

