using System;
using System.Collections.Generic;
using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    [CreateAssetMenu(menuName = "Mapmate/Prefab Palette", fileName = "MapmatePrefabPalette")]
    public sealed class MapmatePrefabPalette : ScriptableObject
    {
        [Serializable]
        public sealed class Entry
        {
            public string prefabKey;
            public GameObject prefab;
        }

        [SerializeField] private List<Entry> entries = new List<Entry>();

        private Dictionary<string, GameObject> _byKey;

        public void RebuildIndex()
        {
            _byKey = new Dictionary<string, GameObject>(StringComparer.Ordinal);
            foreach (var e in entries)
            {
                if (e == null) continue;
                if (string.IsNullOrEmpty(e.prefabKey)) continue;
                if (e.prefab == null) continue;
                _byKey[e.prefabKey] = e.prefab;
            }
        }

        public bool TryGetPrefab(string prefabKey, out GameObject prefab)
        {
            if (_byKey == null) RebuildIndex();
            if (prefabKey == null) { prefab = null; return false; }
            return _byKey.TryGetValue(prefabKey, out prefab);
        }
    }
}

