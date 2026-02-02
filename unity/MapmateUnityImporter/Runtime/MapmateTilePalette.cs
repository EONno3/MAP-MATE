using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Tilemaps;

namespace Mapmate.UnityImporter.Runtime
{
    [CreateAssetMenu(menuName = "Mapmate/Tile Palette", fileName = "MapmateTilePalette")]
    public sealed class MapmateTilePalette : ScriptableObject
    {
        [Serializable]
        public sealed class Entry
        {
            public int tileId;
            public string tileKey;
            public TileBase tile;
        }

        [SerializeField] private List<Entry> entries = new List<Entry>();

        private Dictionary<int, TileBase> _byId;
        private Dictionary<string, TileBase> _byKey;

        public void RebuildIndex()
        {
            _byId = new Dictionary<int, TileBase>();
            _byKey = new Dictionary<string, TileBase>(StringComparer.Ordinal);

            foreach (var e in entries)
            {
                if (e == null) continue;
                if (e.tile != null)
                {
                    _byId[e.tileId] = e.tile;
                    if (!string.IsNullOrEmpty(e.tileKey))
                        _byKey[e.tileKey] = e.tile;
                }
            }
        }

        public bool TryGetTileById(int tileId, out TileBase tile)
        {
            if (_byId == null) RebuildIndex();
            return _byId.TryGetValue(tileId, out tile);
        }

        public bool TryGetTileByKey(string tileKey, out TileBase tile)
        {
            if (_byKey == null) RebuildIndex();
            if (tileKey == null) { tile = null; return false; }
            return _byKey.TryGetValue(tileKey, out tile);
        }
    }
}

