using NUnit.Framework;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateDoorTriggerTests
    {
        [Test]
        public void Computes_Destination_When_Endpoint_Is_From()
        {
            var ok = MapmateDoorTrigger.TryComputeDestinationRoomId(endpointRoomId: 1, fromRoomId: 1, toRoomId: 2, out var dest);
            Assert.IsTrue(ok);
            Assert.AreEqual(2, dest);
        }

        [Test]
        public void Computes_Destination_When_Endpoint_Is_To()
        {
            var ok = MapmateDoorTrigger.TryComputeDestinationRoomId(endpointRoomId: 2, fromRoomId: 1, toRoomId: 2, out var dest);
            Assert.IsTrue(ok);
            Assert.AreEqual(1, dest);
        }

        [Test]
        public void Returns_False_When_Endpoint_Room_Not_Matching()
        {
            var ok = MapmateDoorTrigger.TryComputeDestinationRoomId(endpointRoomId: 999, fromRoomId: 1, toRoomId: 2, out var dest);
            Assert.IsFalse(ok);
            Assert.AreEqual(0, dest);
        }
    }
}

