import React, { useEffect, useRef, useState } from 'react'
import { RoomDetail, TILE_SIZE, TileType, UNITY_COMPONENT_MAP } from '../../types/map'
import { X, Play, Settings2 } from 'lucide-react'

interface PlayTestModeProps {
    roomDetail: RoomDetail
    onClose: () => void
    tileColors: Record<string, string>
}

const PLAYER_SIZE = 24

export function PlayTestMode({ roomDetail, onClose, tileColors }: PlayTestModeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [gravity, setGravity] = useState(0.5)
    const [jumpForce, setJumpForce] = useState(-10)
    const [moveSpeed, setMoveSpeed] = useState(5)

    const physicsRef = useRef({ gravity, jumpForce, moveSpeed })
    useEffect(() => {
        physicsRef.current = { gravity, jumpForce, moveSpeed }
    }, [gravity, jumpForce, moveSpeed])

    // Game state
    const stateRef = useRef({
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        isGrounded: false,
        keys: {} as Record<string, boolean>,
        lastTime: performance.now(),
        isDead: false
    })

    // Initialize player at spawn point if available
    useEffect(() => {
        let spawnX = 100
        let spawnY = 100
        const spawnObj = roomDetail.layers.flatMap(l => l.objects || []).find(o => o.type === 'spawn_point')
        if (spawnObj) {
            spawnX = spawnObj.x * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE) / 2
            spawnY = spawnObj.y * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE)
        }
        stateRef.current.x = spawnX
        stateRef.current.y = spawnY
    }, [roomDetail])

    // Game Loop
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationId: number

        // Extract solid tiles and hazards
        const solidTiles: { x: number, y: number, w: number, h: number, type: TileType }[] = []

        for (const layer of roomDetail.layers) {
            if (!layer.visible || layer.type !== 'tile' || !layer.tiles) continue
            for (let y = 0; y < roomDetail.tileHeight; y++) {
                for (let x = 0; x < roomDetail.tileWidth; x++) {
                    const tile = layer.tiles[y]?.[x] || 'empty'
                    if (tile === 'solid' || tile === 'platform' || tile === 'spike' || tile === 'acid') {
                        solidTiles.push({
                            x: x * TILE_SIZE,
                            y: y * TILE_SIZE,
                            w: TILE_SIZE,
                            h: TILE_SIZE,
                            type: tile
                        })
                    }
                }
            }
        }

        const checkCollision = (cx: number, cy: number, cw: number, ch: number) => {
            for (const t of solidTiles) {
                if (
                    cx < t.x + t.w &&
                    cx + cw > t.x &&
                    cy < t.y + t.h &&
                    cy + ch > t.y
                ) {
                    return t
                }
            }
            return null
        }

        const loop = (time: number) => {
            // Calculate delta
            const st = stateRef.current
            const dt = Math.min((time - st.lastTime) / 1000, 0.1)
            st.lastTime = time

            if (!st.isDead) {
                // Physics step
                const p = physicsRef.current
                st.vy += p.gravity

                let dx = 0
                if (st.keys['ArrowLeft'] || st.keys['a']) dx -= p.moveSpeed
                if (st.keys['ArrowRight'] || st.keys['d']) dx += p.moveSpeed

                // X collision
                let nextX = st.x + dx
                let hitX = checkCollision(nextX, st.y, PLAYER_SIZE, PLAYER_SIZE)
                if (hitX) {
                    if (hitX.type === 'spike' || hitX.type === 'acid') st.isDead = true
                    else if (hitX.type === 'solid' || (hitX.type === 'platform' && !st.keys['ArrowDown'] && !st.keys['s'])) {
                        if (dx > 0) nextX = hitX.x - PLAYER_SIZE - 0.1
                        else if (dx < 0) nextX = hitX.x + hitX.w + 0.1
                    }
                }
                st.x = nextX

                // Y collision
                st.isGrounded = false
                let nextY = st.y + st.vy
                let hitY = checkCollision(st.x, nextY, PLAYER_SIZE, PLAYER_SIZE)
                if (hitY) {
                    if (hitY.type === 'spike' || hitY.type === 'acid') {
                        st.isDead = true
                    } else if (hitY.type === 'solid' || (hitY.type === 'platform' && st.vy >= 0 && st.y + PLAYER_SIZE <= hitY.y + 0.1 && !st.keys['ArrowDown'] && !st.keys['s'])) {
                        if (st.vy > 0) {
                            nextY = hitY.y - PLAYER_SIZE - 0.1
                            st.isGrounded = true
                        } else if (st.vy < 0) {
                            nextY = hitY.y + hitY.h + 0.1
                        }
                        st.vy = 0
                    }
                }
                st.y = nextY
            }

            // Drawing
            canvas.width = roomDetail.tileWidth * TILE_SIZE
            canvas.height = roomDetail.tileHeight * TILE_SIZE
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw Map Background
            ctx.fillStyle = '#1a1a24'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            for (const layer of roomDetail.layers) {
                if (!layer.visible || layer.type !== 'tile' || !layer.tiles) continue
                ctx.globalAlpha = layer.opacity
                for (let y = 0; y < roomDetail.tileHeight; y++) {
                    for (let x = 0; x < roomDetail.tileWidth; x++) {
                        const t = layer.tiles[y]?.[x] || 'empty'
                        if (t !== 'empty') {
                            ctx.fillStyle = tileColors[t] || '#fff'
                            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                        }
                    }
                }
            }
            ctx.globalAlpha = 1

            // Draw Player
            ctx.fillStyle = st.isDead ? 'red' : '#00ffd0'
            ctx.fillRect(st.x, st.y, PLAYER_SIZE, PLAYER_SIZE)

            if (st.isDead) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.fillStyle = 'white'
                ctx.font = '24px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('YOU DIED', canvas.width / 2, canvas.height / 2)
                ctx.font = '14px Arial'
                ctx.fillText('Press R to Retry', canvas.width / 2, canvas.height / 2 + 30)
            }

            animationId = requestAnimationFrame(loop)
        }

        animationId = requestAnimationFrame(loop)

        return () => cancelAnimationFrame(animationId)
    }, [roomDetail])

    // Input listeners
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            stateRef.current.keys[e.key] = true

            if (e.key === 'r' && stateRef.current.isDead) {
                stateRef.current.isDead = false
                stateRef.current.vy = 0

                let spawnX = 100, spawnY = 100
                const spawnObj = roomDetail.layers.flatMap(l => l.objects || []).find(o => o.type === 'spawn_point')
                if (spawnObj) {
                    spawnX = spawnObj.x * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE) / 2
                    spawnY = spawnObj.y * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE)
                }
                stateRef.current.x = spawnX
                stateRef.current.y = spawnY
            }

            if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && stateRef.current.isGrounded && !stateRef.current.isDead) {
                stateRef.current.vy = physicsRef.current.jumpForce
            }
        }
        const onKeyUp = (e: KeyboardEvent) => {
            stateRef.current.keys[e.key] = false
        }

        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [roomDetail])

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(13, 13, 18, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Top Bar with higher zIndex */}
            <div style={{ position: 'absolute', top: 16, zIndex: 110, display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ background: 'var(--accent-green)', fontWeight: 'bold', color: '#000', padding: '6px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Play size={16} fill="#000" /> 플레이 테스트 모드
                </div>
                <button onClick={() => setShowSettings(!showSettings)} className="btn-base" style={{ background: 'var(--bg-panel)', padding: '6px 12px' }}><Settings2 size={16} /> 설정</button>
                <button onClick={onClose} className="btn-base" style={{ background: 'var(--accent-red)', color: '#fff', padding: '6px 12px' }}><X size={16} /> 에디터로 돌아가기</button>
            </div>

            {/* Settings Overlay */}
            {showSettings && (
                <div className="panel-base animate-fade-in" style={{ position: 'absolute', top: 60, zIndex: 110, padding: 16, width: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>물리 설정</div>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>중력 (Gravity)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="0.1" max="2" step="0.1" value={gravity} onChange={(e) => setGravity(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30 }}>{gravity.toFixed(1)}</span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>점프력 (Jump Force)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="-20" max="-5" step="1" value={jumpForce} onChange={(e) => setJumpForce(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30 }}>{Math.abs(jumpForce)}</span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>이동 속도 (Move Speed)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="1" max="15" step="1" value={moveSpeed} onChange={(e) => setMoveSpeed(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30 }}>{moveSpeed}</span>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                width: roomDetail.tileWidth * TILE_SIZE,
                height: roomDetail.tileHeight * TILE_SIZE,
                border: '2px solid var(--accent-green)',
                boxShadow: '0 0 40px rgba(0, 255, 136, 0.2)',
                position: 'relative',
                transform: `scale(${Math.min(1, (window.innerWidth - 100) / (roomDetail.tileWidth * TILE_SIZE), (window.innerHeight - 150) / (roomDetail.tileHeight * TILE_SIZE))})`
            }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
        </div>
    )
}
