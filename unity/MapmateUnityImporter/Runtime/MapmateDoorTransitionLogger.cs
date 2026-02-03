using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    // 예시 핸들러: 실제 게임에서는 여기서 룸 로딩/씬 전환/플레이어 이동 등을 수행
    public sealed class MapmateDoorTransitionLogger : MonoBehaviour, IMapmateDoorTransitionHandler
    {
        public void HandleDoorTransition(MapmateDoorTransitionRequest request, Collider2D other)
        {
            var otherName = other != null ? other.name : "(null)";
            Debug.Log($"[MapmateDoorTransitionLogger] {otherName}: room {request.endpointRoomId} -> {request.destinationRoomId} (cond={request.condition})", this);
        }
    }
}

