import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Room, MapData, Connection } from '../../types/map'
import { RoomNavigatorCanvas } from './RoomNavigatorCanvas'

interface RoomNavigatorProps {
    mapData: MapData
    currentRoom: Room
    connections?: Connection[]
    onDoubleClickRoom?: (roomId: number) => void
}

export function RoomNavigator({ mapData, currentRoom, connections = [], onDoubleClickRoom }: RoomNavigatorProps) {
    const [isLargeOpen, setIsLargeOpen] = useState(false)
    const closeLarge = () => setIsLargeOpen(false)
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
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
            }}>
                <span>방 내비게이션</span>
                <button
                    onClick={() => setIsLargeOpen(true)}
                    className="btn-base btn-secondary"
                    style={{ padding: '4px 8px', fontSize: 10 }}
                    title="큰 화면으로 보기"
                >
                    크게 보기
                </button>
            </div>
            <div style={{ width: '100%', height: 'calc(100% - 25px)' }}>
                <RoomNavigatorCanvas
                    mapData={mapData}
                    currentRoom={currentRoom}
                    connections={connections}
                    onDoubleClickRoom={onDoubleClickRoom}
                />
            </div>

            <RoomNavigatorLargeModal
                isOpen={isLargeOpen}
                onClose={closeLarge}
                mapData={mapData}
                currentRoom={currentRoom}
                connections={connections}
                onDoubleClickRoom={onDoubleClickRoom}
            />
        </div>
    )
}

function RoomNavigatorLargeModal(props: {
    isOpen: boolean
    onClose: () => void
    mapData: MapData
    currentRoom: Room
    connections: Connection[]
    onDoubleClickRoom?: (roomId: number) => void
}) {
    const { isOpen, onClose, mapData, currentRoom, connections, onDoubleClickRoom } = props

    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null
    if (typeof document === 'undefined') return null

    return createPortal(
        <div
            className="animate-fade-in"
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(13, 13, 18, 0.8)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 20,
            }}
            onClick={onClose}
        >
            <div
                className="panel-base animate-slide-up"
                style={{
                    width: '80vw',
                    height: '80vh',
                    maxWidth: 1400,
                    maxHeight: 900,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xl)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>방 내비게이션(확대)</div>
                    <button
                        onClick={onClose}
                        className="btn-base btn-secondary"
                        style={{ padding: '6px 10px', fontSize: 12 }}
                    >
                        닫기
                    </button>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <RoomNavigatorCanvas
                        mapData={mapData}
                        currentRoom={currentRoom}
                        connections={connections}
                        onDoubleClickRoom={onDoubleClickRoom}
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}
