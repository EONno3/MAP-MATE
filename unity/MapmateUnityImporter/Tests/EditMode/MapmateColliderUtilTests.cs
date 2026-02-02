using NUnit.Framework;
using UnityEngine;

namespace Mapmate.UnityImporter.Editor.Tests
{
    public sealed class MapmateColliderUtilTests
    {
        [Test]
        public void EnsureBoxCollider2D_Adds_And_Configures()
        {
            var go = new GameObject("test");
            try
            {
                var col = MapmateColliderUtil.EnsureBoxCollider2D(go, new Vector2(0.25f, 0.5f), true);
                Assert.IsNotNull(col);
                Assert.AreEqual(new Vector2(0.25f, 0.5f), col.size);
                Assert.IsTrue(col.isTrigger);
            }
            finally
            {
                Object.DestroyImmediate(go);
            }
        }
    }
}

