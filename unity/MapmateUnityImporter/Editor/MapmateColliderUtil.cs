using UnityEngine;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateColliderUtil
    {
        public static BoxCollider2D EnsureBoxCollider2D(GameObject go, Vector2 size, bool isTrigger)
        {
            var col = go.GetComponent<BoxCollider2D>();
            if (col == null) col = go.AddComponent<BoxCollider2D>();
            col.size = size;
            col.isTrigger = isTrigger;
            return col;
        }
    }
}

