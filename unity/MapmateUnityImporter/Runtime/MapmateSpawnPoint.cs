using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    [DisallowMultipleComponent]
    public sealed class MapmateSpawnPoint : MonoBehaviour
    {
        [Tooltip("이 스폰포인트가 속한 룸 ID (Mapmate export 기준).")]
        public int roomId;

        private void OnDrawGizmos()
        {
            Gizmos.color = new Color(0.2f, 0.7f, 1.0f, 0.9f);
            Gizmos.DrawWireSphere(transform.position, 0.25f);
            Gizmos.DrawLine(transform.position, transform.position + Vector3.up * 0.5f);
        }
    }
}

