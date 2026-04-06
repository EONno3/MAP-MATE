using System;
using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    [DisallowMultipleComponent]
    public sealed class MapmateBasicDoorTransitionHandler2D : MonoBehaviour, IMapmateDoorTransitionHandler
    {
        [SerializeField] private string playerTag = "Player";

        public void HandleDoorTransition(MapmateDoorTransitionRequest request, Collider2D other)
        {
            var player = ResolvePlayerTransform(other);
            if (player == null) return;

            if (TryFindSpawnPoint(request.destinationRoomId, out var sp) && sp != null)
            {
                player.position = sp.transform.position;
                return;
            }

            // fallback: door endpoint를 기준으로 한 타일 오프셋(시각적으로 어색하지 않게)
            player.position = new Vector3(request.worldTile.x + 0.5f, request.worldTile.y + 0.5f, player.position.z);
        }

        private Transform ResolvePlayerTransform(Collider2D other)
        {
            if (other != null)
            {
                if (other.CompareTag(playerTag)) return other.transform;
            }

            var go = GameObject.FindGameObjectWithTag(playerTag);
            if (go != null) return go.transform;

            var controller = FindObjectOfType<MapmatePlayerController2D>();
            return controller != null ? controller.transform : null;
        }

        public static bool TryFindSpawnPoint(int roomId, out MapmateSpawnPoint spawnPoint)
        {
            spawnPoint = null;
            var all = FindObjectsOfType<MapmateSpawnPoint>();
            for (var i = 0; i < all.Length; i++)
            {
                var sp = all[i];
                if (sp == null) continue;
                if (sp.roomId != roomId) continue;
                spawnPoint = sp;
                return true;
            }
            return false;
        }
    }
}

