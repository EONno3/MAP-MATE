import React, { useEffect, useRef, useState } from 'react'
import { RoomDetail, TILE_SIZE, TileType, UNITY_COMPONENT_MAP, PlayTestSettings } from '../../types/map'
import { X, Play, Settings2, Sparkles } from 'lucide-react'

interface PlayTestModeProps {
    roomDetail: RoomDetail
    onClose: () => void
    tileColors: Record<string, string>
    settings?: PlayTestSettings
    onUpdateSettings?: (settings: PlayTestSettings) => void
}

const PLAYER_SIZE = 24

export function PlayTestMode({ roomDetail, onClose, tileColors, settings, onUpdateSettings }: PlayTestModeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [showSettings, setShowSettings] = useState(true)
    const [maxJumpHeight, setMaxJumpHeight] = useState(settings?.maxJumpHeight ?? 3) // 타일 단위
    const [timeToApex, setTimeToApex] = useState(settings?.timeToApex ?? 0.4) // 초 단위

    // Phase 2 파라미터들
    const [maxMoveSpeed, setMaxMoveSpeed] = useState(settings?.maxMoveSpeed ?? 8) // 초당 이동 타일 수
    const [accelerationTime, setAccelerationTime] = useState(settings?.accelerationTime ?? 0.1) // 최고속도 도달 시간(초)
    const [groundFriction, setGroundFriction] = useState(settings?.groundFriction ?? 0.1) // 감속 시간(초)
    const [fallGravityMultiplier, setFallGravityMultiplier] = useState(settings?.fallGravityMultiplier ?? 1.5) // 낙하 시 중력 배수
    const [terminalVelocity, setTerminalVelocity] = useState(settings?.terminalVelocity ?? 25) // 최대 낙하 속도 (타일/초)

    const [coyoteTime, setCoyoteTime] = useState(settings?.coyoteTime ?? 0.1) // 코요테 타임 (초)
    const [jumpBufferTime, setJumpBufferTime] = useState(settings?.jumpBufferTime ?? 0.1) // 점프 버퍼 (초)

    // Phase 4 파라미터
    const [sprintSpeedMultiplier, setSprintSpeedMultiplier] = useState(settings?.sprintSpeedMultiplier ?? 1.5) // 달리기 배수

    const handleClose = () => {
        if (onUpdateSettings) {
            onUpdateSettings({
                maxJumpHeight, timeToApex, maxMoveSpeed, accelerationTime, groundFriction,
                fallGravityMultiplier, terminalVelocity, coyoteTime, jumpBufferTime, sprintSpeedMultiplier
            })
        }
        onClose()
    }



    const physicsRef = useRef({
        gravity: 0,
        jumpForce: 0,
        maxMoveSpeed: 0,
        acceleration: 0,
        friction: 0,
        fallGravityMultiplier,
        terminalVelocity: 0,
        coyoteTime,
        jumpBufferTime,
        sprintSpeedMultiplier
    })

    useEffect(() => {
        const h = maxJumpHeight * TILE_SIZE
        const derivedGravity = (2 * h) / (timeToApex * timeToApex)
        const derivedJumpForce = -((2 * h) / timeToApex)

        // 초당 픽셀 단위로 변환
        const maxSpeedPx = maxMoveSpeed * TILE_SIZE
        const accelPx = accelerationTime > 0 ? maxSpeedPx / accelerationTime : maxSpeedPx * 100
        const frictionPx = groundFriction > 0 ? maxSpeedPx / groundFriction : maxSpeedPx * 100
        const terminalVelPx = terminalVelocity * TILE_SIZE

        physicsRef.current = {
            gravity: derivedGravity,
            jumpForce: derivedJumpForce,
            maxMoveSpeed: maxSpeedPx,
            acceleration: accelPx,
            friction: frictionPx,
            fallGravityMultiplier,
            terminalVelocity: terminalVelPx,
            coyoteTime,
            jumpBufferTime,
            sprintSpeedMultiplier
        }
    }, [maxJumpHeight, timeToApex, maxMoveSpeed, accelerationTime, groundFriction, fallGravityMultiplier, terminalVelocity, coyoteTime, jumpBufferTime, sprintSpeedMultiplier])

    // Game state
    const stateRef = useRef({
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        isGrounded: false,
        keys: {} as Record<string, boolean>,
        lastTime: performance.now(),
        isDead: false,
        coyoteTimer: 0,
        jumpBufferTimer: 0
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
            const dt = Math.min((time - st.lastTime) / 1000, 0.1) // Max dt 0.1s to prevent huge jumps
            st.lastTime = time

            if (!st.isDead) {
                const p = physicsRef.current

                // Timers update
                if (st.isGrounded) {
                    st.coyoteTimer = p.coyoteTime
                } else {
                    st.coyoteTimer -= dt
                }

                st.jumpBufferTimer -= dt

                // === Vertical Physics ===
                // Apply Gravity (with fall multiplier)
                let currentGravity = p.gravity
                // 점프 상승 중이 아니거나 (떨어지는 중), 혹은 점프 키를 뗐을 때 더 강한 중력 적용
                if (st.vy > 0 || (!st.keys['ArrowUp'] && !st.keys['w'] && !st.keys[' '])) {
                    currentGravity *= p.fallGravityMultiplier
                }
                st.vy += currentGravity * dt

                // Terminal Velocity clamp
                if (st.vy > p.terminalVelocity) {
                    st.vy = p.terminalVelocity
                }

                // === Jump Logic ===
                if (st.jumpBufferTimer > 0 && st.coyoteTimer > 0) {
                    st.vy = p.jumpForce
                    st.jumpBufferTimer = 0
                    st.coyoteTimer = 0 // 점프를 소모함
                    st.isGrounded = false
                }

                // === Horizontal Physics ===
                let moveInput = 0
                if (st.keys['ArrowLeft'] || st.keys['a']) moveInput -= 1
                if (st.keys['ArrowRight'] || st.keys['d']) moveInput += 1

                const isSprinting = st.keys['Shift']
                const currentMultiplier = isSprinting ? p.sprintSpeedMultiplier : 1
                const currentMaxSpeed = p.maxMoveSpeed * currentMultiplier
                const currentAcceleration = p.acceleration * currentMultiplier

                if (moveInput !== 0) {
                    // 가속
                    st.vx += moveInput * currentAcceleration * dt
                    // 최대 속도 클램프
                    if (Math.abs(st.vx) > currentMaxSpeed) {
                        st.vx = Math.sign(st.vx) * currentMaxSpeed
                    }
                } else {
                    // 감속 (마찰력)
                    if (st.vx > 0) {
                        st.vx = Math.max(0, st.vx - p.friction * dt)
                    } else if (st.vx < 0) {
                        st.vx = Math.min(0, st.vx + p.friction * dt)
                    }
                }

                const dx = st.vx * dt
                const dy = st.vy * dt

                // X collision
                let nextX = st.x + dx
                let hitX = checkCollision(nextX, st.y, PLAYER_SIZE, PLAYER_SIZE - 2) // 약간의 오차 허용
                if (hitX) {
                    if (hitX.type === 'spike' || hitX.type === 'acid') st.isDead = true
                    else if (hitX.type === 'solid' || (hitX.type === 'platform' && !st.keys['ArrowDown'] && !st.keys['s'])) {
                        if (dx > 0) nextX = hitX.x - PLAYER_SIZE - 0.1
                        else if (dx < 0) nextX = hitX.x + hitX.w + 0.1
                        st.vx = 0 // 벽에 닿으면 속도 0
                    }
                }
                st.x = nextX

                // Y collision
                st.isGrounded = false
                let nextY = st.y + dy
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
                stateRef.current.vx = 0

                let spawnX = 100, spawnY = 100
                const spawnObj = roomDetail.layers.flatMap(l => l.objects || []).find(o => o.type === 'spawn_point')
                if (spawnObj) {
                    spawnX = spawnObj.x * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE) / 2
                    spawnY = spawnObj.y * TILE_SIZE + (TILE_SIZE - PLAYER_SIZE)
                }
                stateRef.current.x = spawnX
                stateRef.current.y = spawnY
            }

            if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && !stateRef.current.isDead) {
                // Buffer the jump input
                stateRef.current.jumpBufferTimer = physicsRef.current.jumpBufferTime
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
                <button
                    onClick={() => {
                        const event = new CustomEvent('toggle-tutorial-mode')
                        window.dispatchEvent(event)
                    }}
                    className="btn-base btn-icon"
                    title="튜토리얼 모드 (기능 설명 보기)"
                    data-tutorial="toolbar-tutorial-mode"
                    data-tutorial-bypass="true"
                    style={{ color: 'var(--accent-yellow)', border: '1px solid rgba(250, 204, 21, 0.3)', backgroundColor: 'rgba(250, 204, 21, 0.05)' }}
                >
                    <Sparkles size={18} />
                </button>
                <button onClick={() => setShowSettings(!showSettings)} data-tutorial="playtest-physics" className="btn-base" style={{ background: 'var(--accent-blue)', color: '#fff', padding: '6px 12px' }}><Settings2 size={16} /> 설정</button>
                <button onClick={handleClose} data-tutorial="playtest-exit" className="btn-base" style={{ background: 'var(--accent-red)', color: '#fff', padding: '6px 12px' }}><X size={16} /> 에디터로 돌아가기</button>
            </div>

            {/* Settings Overlay - 위치 우측 갱신 */}
            {showSettings && (
                <div className="panel-base animate-fade-in" style={{ position: 'absolute', top: 60, right: 20, zIndex: 110, padding: 16, width: 320, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>점프 (Jump)</div>
                    <div data-tutorial="playtest-param-jump">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>점프 높이 (최대 타일)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="1" max="10" step="0.5" value={maxJumpHeight} onChange={(e) => setMaxJumpHeight(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{maxJumpHeight.toFixed(1)}</span>
                        </div>
                    </div>
                    <div data-tutorial="playtest-param-airtime">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>점프 도달 시간 (초)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="0.1" max="1.5" step="0.05" value={timeToApex} onChange={(e) => setTimeToApex(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{timeToApex.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={{ fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid var(--border-light)', paddingBottom: 8, marginTop: 8 }}>수평 이동 (Horizontal Movement)</div>
                    <div data-tutorial="playtest-param-speed">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>최고 속도 (타일/초)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="1" max="20" step="1" value={maxMoveSpeed} onChange={(e) => setMaxMoveSpeed(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{maxMoveSpeed}</span>
                        </div>
                    </div>
                    <div data-tutorial="playtest-param-accel">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>가속 시간 (초)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="0" max="1" step="0.05" value={accelerationTime} onChange={(e) => setAccelerationTime(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{accelerationTime.toFixed(2)}</span>
                        </div>
                    </div>
                    <div data-tutorial="playtest-param-friction">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>감속 시간 (마찰력, 초)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="0" max="1" step="0.05" value={groundFriction} onChange={(e) => setGroundFriction(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{groundFriction.toFixed(2)}</span>
                        </div>
                    </div>

                    <div style={{ fontWeight: 'bold', fontSize: 13, borderBottom: '1px solid var(--border-light)', paddingBottom: 8, marginTop: 8 }}>수직 이동/보정 (Vertical & Forgiveness)</div>
                    <div data-tutorial="playtest-param-gravity">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>낙하 중력 배수 (빠른 하강)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="1" max="4" step="0.1" value={fallGravityMultiplier} onChange={(e) => setFallGravityMultiplier(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{fallGravityMultiplier.toFixed(1)}</span>
                        </div>
                    </div>
                    <div data-tutorial="playtest-param-terminal">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>최대 낙하 속도 (타일/초)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="10" max="50" step="1" value={terminalVelocity} onChange={(e) => setTerminalVelocity(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{terminalVelocity}</span>
                        </div>
                    </div>
                    <div data-tutorial="playtest-param-coyote">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>코요테 타임 (초)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="0" max="0.5" step="0.05" value={coyoteTime} onChange={(e) => setCoyoteTime(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{coyoteTime.toFixed(2)}</span>
                        </div>
                    </div>
                    <div data-tutorial="playtest-param-buffer">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>점프 버퍼 (선입력, 초)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="0" max="0.5" step="0.05" value={jumpBufferTime} onChange={(e) => setJumpBufferTime(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>{jumpBufferTime.toFixed(2)}</span>
                        </div>
                    </div>
                    <div data-tutorial="playtest-param-sprint">
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>달리기 배수 (Shift, Sprint Speed)</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type="range" min="1" max="3" step="0.1" value={sprintSpeedMultiplier} onChange={(e) => setSprintSpeedMultiplier(parseFloat(e.target.value))} style={{ flex: 1 }} />
                            <span style={{ fontSize: 12, width: 30, textAlign: 'right' }}>x{sprintSpeedMultiplier.toFixed(1)}</span>
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
