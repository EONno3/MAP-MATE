using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(MapmateLinkEndpoint))]
    public sealed class MapmateDoorAutoTransition2D : MonoBehaviour
    {
        [Tooltip("이 오브젝트의 trigger에 들어온 Collider2D가 이 태그를 가져야만 동작합니다. 비워두면 검사하지 않습니다.")]
        [SerializeField] private string requiredOtherTag = "Player";

        [Tooltip("전환 처리를 받을 핸들러(프로젝트에서 구현). 비워두면 씬에서 자동 탐색합니다.")]
        [SerializeField] private MonoBehaviour transitionHandler;

        private MapmateLinkEndpoint _endpoint;
        private IMapmateDoorTransitionHandler _handler;

        private void Awake()
        {
            _endpoint = GetComponent<MapmateLinkEndpoint>();
            _handler = transitionHandler as IMapmateDoorTransitionHandler;
        }

        private void OnValidate()
        {
            if (transitionHandler != null && !(transitionHandler is IMapmateDoorTransitionHandler))
            {
                transitionHandler = null;
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!IsAllowed(other)) return;
            if (_endpoint == null) _endpoint = GetComponent<MapmateLinkEndpoint>();
            if (_endpoint == null) return;

            if (!MapmateDoorTransitionLogic.TryBuildRequest(
                    endpointRoomId: _endpoint.roomId,
                    fromRoomId: _endpoint.fromRoomId,
                    toRoomId: _endpoint.toRoomId,
                    condition: _endpoint.condition,
                    worldTile: _endpoint.worldTile,
                    facing: _endpoint.facing,
                    out var req))
            {
                return;
            }

            var handler = ResolveHandler();
            if (handler == null)
            {
                Debug.Log($"[MapmateDoorAutoTransition2D] No handler. Door {req.endpointRoomId}->{req.destinationRoomId}", this);
                return;
            }

            handler.HandleDoorTransition(req, other);
        }

        private IMapmateDoorTransitionHandler ResolveHandler()
        {
            if (_handler != null) return _handler;

            var fromField = transitionHandler as IMapmateDoorTransitionHandler;
            if (fromField != null) return _handler = fromField;

            // 0-설정: 씬에서 핸들러를 자동 탐색
            var behaviours = FindObjectsOfType<MonoBehaviour>();
            for (var i = 0; i < behaviours.Length; i++)
            {
                var mb = behaviours[i];
                if (mb == null) continue;
                if (ReferenceEquals(mb, this)) continue;
                if (mb is IMapmateDoorTransitionHandler h) return _handler = h;
            }

            return null;
        }

        private bool IsAllowed(Collider2D other)
        {
            if (other == null) return false;
            if (string.IsNullOrEmpty(requiredOtherTag)) return true;
            return other.CompareTag(requiredOtherTag);
        }
    }
}

