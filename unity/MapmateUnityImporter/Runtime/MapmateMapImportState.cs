using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    public sealed class MapmateMapImportState : MonoBehaviour
    {
        [Header("Source (for editor guardrails)")]
        public string jsonSource;
        public string jsonHashSha256;
        public long importedAtUnixMs;

        [Header("Editable workflow")]
        public bool madeEditable;
        public long madeEditableAtUnixMs;
    }
}

