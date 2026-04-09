using System;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateImportHash
    {
        public static string ComputeSha256Hex(string text)
        {
            if (text == null) text = string.Empty;
            var bytes = Encoding.UTF8.GetBytes(text);
            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(bytes);
            return ToLowerHex(hash);
        }

        private static string ToLowerHex(byte[] bytes)
        {
            var c = new char[bytes.Length * 2];
            var idx = 0;
            for (var i = 0; i < bytes.Length; i++)
            {
                var b = bytes[i];
                c[idx++] = NibbleToHexLower(b >> 4);
                c[idx++] = NibbleToHexLower(b & 0xF);
            }
            return new string(c);
        }

        private static char NibbleToHexLower(int value)
        {
            return (char)(value < 10 ? ('0' + value) : ('a' + (value - 10)));
        }
    }

    internal static class MapmateImportGuard
    {
        public static bool HasAnyUserTileEdits(Transform mapRoot)
        {
            if (mapRoot == null) return false;

            var grid = mapRoot.Find("Grid");
            if (grid != null)
            {
                for (var i = 0; i < grid.childCount; i++)
                {
                    var child = grid.GetChild(i);
                    if (child == null) continue;
                    if (!child.name.StartsWith("UserTilemap", StringComparison.Ordinal)) continue;
                    var tm = child.GetComponent<Tilemap>();
                    if (tm != null && HasAnyTile(tm)) return true;
                }
            }

            var userRooms = mapRoot.Find("Grid/Rooms/UserRooms");
            if (userRooms == null) return false;

            var tilemaps = userRooms.GetComponentsInChildren<Tilemap>(includeInactive: true);
            for (var i = 0; i < tilemaps.Length; i++)
            {
                if (tilemaps[i] == null) continue;
                if (HasAnyTile(tilemaps[i])) return true;
            }

            return false;
        }

        private static bool HasAnyTile(Tilemap tilemap)
        {
            if (tilemap == null) return false;

            tilemap.CompressBounds();
            var bounds = tilemap.cellBounds;
            for (var y = bounds.yMin; y < bounds.yMax; y++)
            for (var x = bounds.xMin; x < bounds.xMax; x++)
            {
                if (tilemap.HasTile(new Vector3Int(x, y, 0))) return true;
            }

            return false;
        }
    }
}

