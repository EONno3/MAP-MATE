using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(MapmateLinkEndpoint))]
    public sealed class MapmateDoorTrigger : MonoBehaviour
    {
        [SerializeField] private bool drawGizmos = true;

        private MapmateLinkEndpoint _endpoint;

        private void Awake()
        {
            _endpoint = GetComponent<MapmateLinkEndpoint>();
        }

        public bool TryGetDestinationRoomId(out int destinationRoomId)
        {
            if (_endpoint == null) _endpoint = GetComponent<MapmateLinkEndpoint>();
            if (_endpoint == null)
            {
                destinationRoomId = default;
                return false;
            }

            return TryComputeDestinationRoomId(_endpoint.roomId, _endpoint.fromRoomId, _endpoint.toRoomId, out destinationRoomId);
        }

        public string GetConditionOrEmpty()
        {
            if (_endpoint == null) _endpoint = GetComponent<MapmateLinkEndpoint>();
            return _endpoint != null ? (_endpoint.condition ?? string.Empty) : string.Empty;
        }

        public static bool TryComputeDestinationRoomId(int endpointRoomId, int fromRoomId, int toRoomId, out int destinationRoomId)
        {
            // endpointRoomId가 어느 쪽(roomId)인지에 따라 목적지가 반대편이 됩니다.
            if (endpointRoomId == fromRoomId)
            {
                destinationRoomId = toRoomId;
                return true;
            }

            if (endpointRoomId == toRoomId)
            {
                destinationRoomId = fromRoomId;
                return true;
            }

            destinationRoomId = default;
            return false;
        }

        private void OnDrawGizmosSelected()
        {
            if (!drawGizmos) return;

            var ep = _endpoint != null ? _endpoint : GetComponent<MapmateLinkEndpoint>();
            if (ep == null) return;

            Gizmos.color = new Color(0.2f, 0.9f, 0.6f, 0.9f);
            Gizmos.DrawWireCube(transform.position, new Vector3(0.9f, 0.9f, 0f));

            var dir = FacingToVector(ep.facing);
            var start = transform.position;
            var end = start + new Vector3(dir.x, dir.y, 0f) * 0.6f;
            Gizmos.DrawLine(start, end);
            Gizmos.DrawSphere(end, 0.06f);
        }

        private static Vector2 FacingToVector(MapmateFacing facing)
        {
            switch (facing)
            {
                case MapmateFacing.Up: return Vector2.up;
                case MapmateFacing.Down: return Vector2.down;
                case MapmateFacing.Left: return Vector2.left;
                case MapmateFacing.Right: return Vector2.right;
                default: return Vector2.right;
            }
        }
    }
}

