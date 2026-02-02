using Newtonsoft.Json.Linq;
using NUnit.Framework;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateTileDecoderTests
    {
        [Test]
        public void Rle1d_Decodes_To_Full_Length()
        {
            var detail = new Mapmate.UnityImporter.Editor.MapmateUnityExportV1.RoomDetail
            {
                tileWidth = 4,
                tileHeight = 3,
                tilesEncoding = "rle1d",
                tiles = JArray.Parse(@"[
                  { ""id"": 1, ""run"": 6 },
                  { ""id"": 0, ""run"": 6 }
                ]"),
                objects = null
            };

            var grid = Mapmate.UnityImporter.Editor.MapmateTileDecoder.DecodeTo2D(detail);
            Assert.AreEqual(3, grid.GetLength(0));
            Assert.AreEqual(4, grid.GetLength(1));
            Assert.AreEqual(1, grid[0, 0]);
            Assert.AreEqual(0, grid[2, 3]);
        }
    }
}

