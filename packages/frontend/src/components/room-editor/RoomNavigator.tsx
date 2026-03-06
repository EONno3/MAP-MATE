import React, { useRef, useEffect } from 'react'
import { Room, MapData, Connection, GATE_COLORS } from '../../types/map'

interface RoomNavigatorProps {
    mapData: MapData
    currentRoom: Room
    connections?: Connection[]
}

export function RoomNavigator({ mapData, currentRoom, connections = [] }: RoomNavigatorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Calculate center for current room
        const cx = currentRoom.x + currentRoom.w / 2
        const cy = currentRoom.y + currentRoom.h / 2

        // Calculate global navigation scale
        const GRID_SIZE = 12
        const w = canvas.width
        const h = canvas.height

        ctx.clearRect(0, 0, w, h)

        ctx.save()
        ctx.translate(w / 2, h / 2)
        ctx.scale(GRID_SIZE, GRID_SIZE)
        ctx.translate(-cx, -cy)

        // Draw all rooms in the game world
        mapData.rooms.forEach(r => {
            // Zone colors could be matched here if we map them by zone_id, 
            // but for simplicity we highlight the active room and deemphasize others
            const isCurrent = r.id === currentRoom.id

            ctx.fillStyle = isCurrent ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'
            ctx.fillRect(r.x, r.y, r.w, r.h)

            ctx.strokeStyle = isCurrent ? '#60a5fa' : '#555'
            ctx.lineWidth = isCurrent ? 0.2 : 0.1
            ctx.strokeRect(r.x, r.y, r.w, r.h)

            // Draw grid interior lines for bigger rooms
            if (r.w > 1 || r.h > 1) {
                ctx.beginPath()
                for (let ix = 1; ix < r.w; ix++) {
                    ctx.moveTo(r.x + ix, r.y)
                    ctx.lineTo(r.x + ix, r.y + r.h)
                }
                for (let iy = 1; iy < r.h; iy++) {
                    ctx.moveTo(r.x, r.y + iy)
                    ctx.lineTo(r.x + r.w, r.y + iy)
                }
                ctx.strokeStyle = isCurrent ? 'rgba(96, 165, 250, 0.3)' : 'rgba(255, 255, 255, 0.05)'
                ctx.lineWidth = 0.05
                ctx.stroke()
            }
        })

        // Draw connections
        connections.forEach(conn => {
            const fromRoom = mapData.rooms.find(r => r.id === conn.fromId)
            const toRoom = mapData.rooms.find(r => r.id === conn.toId)
            if (!fromRoom || !toRoom) return

            ctx.beginPath()
            ctx.strokeStyle = GATE_COLORS[conn.condition] || '#888'
            ctx.lineWidth = 0.2
            if (conn.condition !== 'none') {
                ctx.setLineDash([0.5, 0.3])
            } else {
                ctx.setLineDash([])
            }

            ctx.moveTo(fromRoom.x + fromRoom.w / 2, fromRoom.y + fromRoom.h / 2)
            ctx.lineTo(toRoom.x + toRoom.w / 2, toRoom.y + toRoom.h / 2)
            ctx.stroke()
            ctx.setLineDash([])
        })

        ctx.restore()
    }, [mapData, currentRoom, connections])

    return (
        <div data-tutorial="roomeditor-navigator" className="animate-fade-in" style={{
            width: '100%',
            height: 200,
            marginTop: 16,
            marginBottom: 16,
            background: 'rgba(13, 13, 18, 0.6)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--border-radius-md)',
            overflow: 'hidden',
            flexShrink: 0
        }}>
            <div style={{
                padding: '6px 10px',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border-light)'
            }}>
                방 내비게이션
            </div>
            <canvas
                ref={canvasRef}
                width={240}
                height={175}
                style={{ width: '100%', height: 'calc(100% - 25px)', display: 'block' }}
            />
        </div>
    )
}
