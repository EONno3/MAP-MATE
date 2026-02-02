using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateTileDecoder
    {
        public static int[,] DecodeTo2D(MapmateUnityExportV1.RoomDetail detail)
        {
            if (detail == null) throw new ArgumentNullException(nameof(detail));
            if (detail.tileWidth <= 0 || detail.tileHeight <= 0) throw new ArgumentException("Invalid tileWidth/tileHeight");

            var w = detail.tileWidth;
            var h = detail.tileHeight;
            var result = new int[h, w];

            var enc = detail.tilesEncoding ?? "raw2d";
            if (string.Equals(enc, "raw2d", StringComparison.OrdinalIgnoreCase))
            {
                DecodeRaw2D(detail.tiles, result);
                return result;
            }

            if (string.Equals(enc, "rle1d", StringComparison.OrdinalIgnoreCase))
            {
                DecodeRle1D(detail.tiles, result);
                return result;
            }

            throw new NotSupportedException($"Unsupported tilesEncoding: {detail.tilesEncoding}");
        }

        private static void DecodeRaw2D(JToken tilesToken, int[,] dst)
        {
            if (tilesToken == null) throw new ArgumentNullException(nameof(tilesToken));
            var outer = tilesToken as JArray;
            if (outer == null) throw new ArgumentException("tiles(raw2d) must be a JSON array");

            var h = dst.GetLength(0);
            var w = dst.GetLength(1);

            for (var y = 0; y < h; y++)
            {
                var row = y < outer.Count ? outer[y] as JArray : null;
                for (var x = 0; x < w; x++)
                {
                    var v = 0;
                    if (row != null && x < row.Count)
                        v = row[x]!.Value<int>();
                    dst[y, x] = v;
                }
            }
        }

        private static void DecodeRle1D(JToken tilesToken, int[,] dst)
        {
            if (tilesToken == null) throw new ArgumentNullException(nameof(tilesToken));
            var arr = tilesToken as JArray;
            if (arr == null) throw new ArgumentException("tiles(rle1d) must be a JSON array");

            var h = dst.GetLength(0);
            var w = dst.GetLength(1);
            var total = w * h;

            var flat = new List<int>(total);
            foreach (var it in arr)
            {
                var obj = it as JObject;
                if (obj == null) continue;
                var id = obj["id"]?.Value<int>() ?? 0;
                var run = obj["run"]?.Value<int>() ?? 0;
                for (var i = 0; i < run; i++) flat.Add(id);
            }

            if (flat.Count < total)
                throw new ArgumentException($"rle1d decoded length too short: {flat.Count} < {total}");

            var idx = 0;
            for (var y = 0; y < h; y++)
            for (var x = 0; x < w; x++)
                dst[y, x] = flat[idx++];
        }
    }
}

