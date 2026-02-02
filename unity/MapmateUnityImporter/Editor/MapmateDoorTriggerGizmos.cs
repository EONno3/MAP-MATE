using UnityEditor;
using UnityEngine;
using Mapmate.UnityImporter.Runtime;

namespace Mapmate.UnityImporter.Editor
{
    internal static class MapmateDoorTriggerGizmos
    {
        [DrawGizmo(GizmoType.Selected | GizmoType.Active)]
        private static void Draw(MapmateDoorTrigger trigger, GizmoType _)
        {
            if (trigger == null) return;
            var ep = trigger.GetComponent<MapmateLinkEndpoint>();
            if (ep == null) return;

            if (!MapmateDoorTrigger.TryComputeDestinationRoomId(ep.roomId, ep.fromRoomId, ep.toRoomId, out var dest))
                return;

            Handles.color = new Color(0.2f, 0.9f, 0.6f, 0.9f);
            Handles.Label(trigger.transform.position + Vector3.up * 0.6f,
                $"Door {ep.roomId} -> {dest}\ncond: {(ep.condition ?? "-")}");
        }
    }
}

