using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    public interface IMapmateDoorTransitionHandler
    {
        void HandleDoorTransition(MapmateDoorTransitionRequest request, Collider2D other);
    }
}

