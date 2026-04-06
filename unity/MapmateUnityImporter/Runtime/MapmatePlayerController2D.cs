using UnityEngine;

namespace Mapmate.UnityImporter.Runtime
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(Collider2D))]
    public sealed class MapmatePlayerController2D : MonoBehaviour
    {
        [Header("Movement")]
        [SerializeField] private float moveSpeed = 6f;
        [SerializeField] private float jumpVelocity = 8f;

        [Header("Ground Check")]
        [SerializeField] private LayerMask groundMask = ~0;
        [SerializeField] private float groundCheckDistance = 0.06f;

        private Rigidbody2D _rb;
        private Collider2D _col;
        private float _moveX;
        private bool _jumpPressed;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _col = GetComponent<Collider2D>();
            _rb.freezeRotation = true;
        }

        private void Update()
        {
            _moveX = Input.GetAxisRaw("Horizontal");
            if (Input.GetButtonDown("Jump")) _jumpPressed = true;
        }

        private void FixedUpdate()
        {
            var v = _rb.linearVelocity;
            v.x = _moveX * moveSpeed;

            if (_jumpPressed)
            {
                _jumpPressed = false;
                if (IsGrounded())
                {
                    v.y = jumpVelocity;
                }
            }

            _rb.linearVelocity = v;
        }

        private bool IsGrounded()
        {
            if (_col == null) return false;
            var b = _col.bounds;
            var origin = new Vector2(b.center.x, b.min.y + 0.01f);
            var hit = Physics2D.Raycast(origin, Vector2.down, groundCheckDistance, groundMask);
            return hit.collider != null && hit.collider != _col;
        }
    }
}

