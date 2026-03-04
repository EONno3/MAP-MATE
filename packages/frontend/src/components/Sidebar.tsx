import React from 'react'
import { Room, Zone, RoomType, ROOM_TYPE_ICONS, Connection, GateCondition, GATE_COLORS } from '../types/map'
import { Translations, getRoomTypeName } from '../i18n/translations'
import { MousePointerClick, Link as LinkIcon, Box, Copy, ClipboardPaste, Trash2, Scissors, Image as ImageIcon, Lightbulb, MapPin } from 'lucide-react'

// 선택된 연결선 타입
interface SelectedConnection {
  fromId: number
  toId: number
}

interface SidebarProps {
  selectedRoom: Room | null
  selectedRoomIds: number[]  // 다중 선택
  zone: Zone | null
  zones: Record<number, Zone>  // 모든 zones
  selectedConnection: SelectedConnection | null
  connections: Connection[]
  rooms: Room[]
  clipboard: Room[]  // 복사된 방들
  onUpdateRoom: (id: number, updates: Partial<Room>, recordHistory?: boolean) => void
  onUpdateSelectedRooms: (updates: Partial<Room>) => void
  onDeleteRoom: (id: number) => void
  onDeleteSelectedRooms: () => void
  onDeleteConnection?: (fromId: number, toId: number) => void
  onUpdateConnection?: (fromId: number, toId: number, condition: GateCondition) => void
  onEditDetail?: (roomId: number) => void
  onSplitRoom?: (id: number) => void
  onCopySelectedRooms?: () => void
  onPasteRooms?: () => void
  t: Translations
}

// Gate condition 목록
const GATE_CONDITIONS: GateCondition[] = [
  'none', 'dash', 'wall_jump', 'double_jump', 'super_dash',
  'swim', 'lantern', 'desolate_dive', 'simple_key', 'city_crest',
  'tram_pass', 'event_lock'
]

const ROOM_TYPES: RoomType[] = ['normal', 'boss', 'save', 'stag', 'map', 'item', 'hub', 'start', 'shop']

export function Sidebar({
  selectedRoom,
  selectedRoomIds,
  zone,
  zones,
  selectedConnection,
  connections,
  rooms,
  clipboard,
  onUpdateRoom,
  onUpdateSelectedRooms,
  onDeleteRoom,
  onDeleteSelectedRooms,
  onDeleteConnection,
  onUpdateConnection,
  onEditDetail,
  onSplitRoom,
  onCopySelectedRooms,
  onPasteRooms,
  t
}: SidebarProps) {
  // 다중 선택 모드인지 확인
  const isMultiSelect = selectedRoomIds.length > 0
  const selectedRooms = rooms.filter(r => selectedRoomIds.includes(r.id))
  // 연결선이 선택된 경우
  if (selectedConnection) {
    const conn = connections.find(c =>
      (c.fromId === selectedConnection.fromId && c.toId === selectedConnection.toId) ||
      (c.fromId === selectedConnection.toId && c.toId === selectedConnection.fromId)
    )
    const fromRoom = rooms.find(r => r.id === selectedConnection.fromId)
    const toRoom = rooms.find(r => r.id === selectedConnection.toId)

    if (!conn) {
      return (
        <div className="panel-base" style={{
          width: 320,
          borderRadius: 0,
          borderTop: 'none', borderBottom: 'none', borderRight: 'none',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)'
        }}>
          <MousePointerClick size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <span style={{ fontSize: 14 }}>{t.clickToEdit}</span>
        </div>
      )
    }

    return (
      <div className="panel-base" style={{
        width: 320,
        borderRadius: 0,
        borderTop: 'none', borderBottom: 'none', borderRight: 'none',
        padding: 20,
        overflowY: 'auto'
      }}>
        {/* 연결선 헤더 */}
        <div style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8
          }}>
            <LinkIcon size={28} color="var(--accent-blue)" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                {t.connectionSelected}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {fromRoom?.name || `${t.room} ${selectedConnection.fromId}`} ↔ {toRoom?.name || `${t.room} ${selectedConnection.toId}`}
              </div>
            </div>
          </div>
        </div>

        {/* 연결 조건 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            {t.connectionCondition}
          </label>
          <select
            value={conn.condition}
            onChange={(e) => {
              if (onUpdateConnection) {
                onUpdateConnection(selectedConnection.fromId, selectedConnection.toId, e.target.value as GateCondition)
              }
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              marginTop: 6,
              backgroundColor: '#252530',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {GATE_CONDITIONS.map(condition => (
              <option key={condition} value={condition} style={{ backgroundColor: '#252530' }}>
                {condition === 'none' ? '없음 (None)' : condition.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <div style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: GATE_COLORS[conn.condition],
              border: '1px solid #555'
            }} />
            <span style={{ color: '#888', fontSize: 12 }}>
              {conn.condition === 'none' ? '기본 연결' : `${conn.condition} 필요`}
            </span>
          </div>
        </div>

        {/* 연결 정보 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            연결된 방
          </label>
          <div style={{
            marginTop: 6,
            padding: '10px 12px',
            backgroundColor: '#252530',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13
          }}>
            <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="var(--accent-indigo)" /> {fromRoom?.name || `${t.room} ${selectedConnection.fromId}`} (ID: {selectedConnection.fromId})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="var(--accent-indigo)" /> {toRoom?.name || `${t.room} ${selectedConnection.toId}`} (ID: {selectedConnection.toId})
            </div>
          </div>
        </div>

        {/* 삭제 버튼 */}
        <button
          onClick={() => {
            if (onDeleteConnection) {
              onDeleteConnection(selectedConnection.fromId, selectedConnection.toId)
            }
          }}
          style={{
            width: '100%',
            marginTop: 20
          }}
        >
          <Trash2 size={16} />
          {t.deleteConnection}
        </button>

        <div style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--border-radius-md)',
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}>
          <Lightbulb size={14} color="var(--accent-blue)" /> Delete 키로도 삭제 가능
        </div>
      </div>
    )
  }

  // 다중 선택 모드 UI
  if (isMultiSelect) {
    // 선택된 방들의 공통 zone_id 확인
    const zoneIds = [...new Set(selectedRooms.map(r => r.zone_id))]
    const commonZoneId = zoneIds.length === 1 ? zoneIds[0] : null

    return (
      <div className="panel-base" style={{
        width: 320,
        borderRadius: 0,
        borderTop: 'none', borderBottom: 'none', borderRight: 'none',
        padding: 20,
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8
          }}>
            <Box size={28} color="var(--accent-indigo)" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#00ffff' }}>
                {selectedRoomIds.length}개 방 선택됨
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                Ctrl+클릭으로 추가/제거
              </div>
            </div>
          </div>
        </div>

        {/* 복사/붙여넣기 버튼 */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16
        }}>
          <button
            onClick={onCopySelectedRooms}
            className="btn-base btn-primary"
            style={{ flex: 1, padding: '10px' }}
          >
            <Copy size={16} /> 복사 (Ctrl+C)
          </button>
          <button
            onClick={onPasteRooms}
            disabled={clipboard.length === 0}
            className={`btn-base ${clipboard.length > 0 ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: clipboard.length > 0 ? 'var(--accent-green)' : undefined,
              color: clipboard.length > 0 ? '#000' : undefined
            }}
          >
            <ClipboardPaste size={16} /> 붙여넣기 (Ctrl+V)
          </button>
        </div>

        {/* 일괄 Zone 변경 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            일괄 구역 변경
          </label>
          <select
            value={commonZoneId ?? ''}
            onChange={(e) => {
              if (e.target.value) {
                onUpdateSelectedRooms({ zone_id: parseInt(e.target.value) })
              }
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              marginTop: 8,
              backgroundColor: '#252530',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {commonZoneId === null && (
              <option value="">-- 혼합됨 --</option>
            )}
            {Object.entries(zones).map(([zoneId, z]) => (
              <option key={zoneId} value={zoneId} style={{ backgroundColor: '#252530' }}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        {/* 일괄 Type 변경 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            일괄 유형 변경
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onUpdateSelectedRooms({ type: e.target.value as RoomType })
              }
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              marginTop: 8,
              backgroundColor: '#252530',
              border: '1px solid #444',
              borderRadius: 6,
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            <option value="">-- 유형 선택 --</option>
            {ROOM_TYPES.map(type => (
              <option key={type} value={type}>
                {ROOM_TYPE_ICONS[type]} {getRoomTypeName(type, t)}
              </option>
            ))}
          </select>
        </div>

        {/* 선택된 방 목록 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            선택된 방 목록
          </label>
          <div style={{
            marginTop: 8,
            maxHeight: 150,
            overflowY: 'auto',
            backgroundColor: '#252530',
            borderRadius: 6,
            padding: 8
          }}>
            {selectedRooms.map(room => (
              <div key={room.id} style={{
                padding: '6px 8px',
                fontSize: 12,
                color: '#ccc',
                borderBottom: '1px solid #333'
              }}>
                {ROOM_TYPE_ICONS[room.type]} {room.name || `${t.room} ${room.id}`}
                <span style={{ color: '#666', marginLeft: 8 }}>
                  ({room.w}×{room.h})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 일괄 삭제 버튼 */}
        <button
          onClick={onDeleteSelectedRooms}
          className="btn-base btn-danger"
          style={{ width: '100%', padding: '10px', marginTop: 20 }}
        >
          <Trash2 size={16} />
          {selectedRoomIds.length}개 방 삭제
        </button>

        {/* 단축키 안내 */}
        <div style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: '#252530',
          borderRadius: 6,
          fontSize: 11,
          color: '#666'
        }}>
          <div style={{ marginBottom: 4 }}>💡 단축키:</div>
          <div>• Ctrl+A: 전체 선택</div>
          <div>• Ctrl+C: 복사</div>
          <div>• Ctrl+V: 붙여넣기</div>
          <div>• Delete: 삭제</div>
          <div>• Esc: 선택 해제</div>
        </div>
      </div>
    )
  }

  if (!selectedRoom) {
    return (
      <div className="panel-base" style={{
        width: 320,
        borderRadius: 0,
        borderTop: 'none', borderBottom: 'none', borderRight: 'none',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)'
      }}>
        <MousePointerClick size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <span style={{ fontSize: 14 }}>{t.clickToEdit}</span>
        <span style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>{t.clickConnectionToEdit}</span>
        <div style={{
          marginTop: 24,
          padding: 16,
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--border-radius-md)',
          fontSize: 12,
          color: 'var(--text-muted)',
          textAlign: 'left',
          width: '100%'
        }}>
          <div style={{ marginBottom: 8, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb size={14} /> 단축키:
          </div>
          <div>• 1: 선택 도구</div>
          <div>• 2: 방 그리기</div>
          <div>• 3: 연결 도구</div>
          <div>• Ctrl+클릭: 다중 선택</div>
          <div>• Ctrl+Z/Y: 실행취소/다시실행</div>
        </div>
        <div style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--border-radius-md)',
          fontSize: 12,
          color: 'var(--text-muted)',
          textAlign: 'left',
          width: '100%'
        }}>
          <div style={{ marginBottom: 8, color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} /> 연결선 범례:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 2, backgroundColor: GATE_COLORS['none'] || '#888' }} />
              <span>기본 (None)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 2, borderBottom: `2px dashed ${GATE_COLORS['dash']}` }} />
              <span>능력 필요</span>
            </div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
            * 연결선을 클릭하여 상세 조건을 변경할 수 있습니다.
          </div>
        </div>
      </div>
    )
  }

  const icon = ROOM_TYPE_ICONS[selectedRoom.type] || '📦'
  const hasDetail = !!selectedRoom.detail

  return (
    <div className="panel-base" style={{
      width: 320,
      borderRadius: 0,
      borderTop: 'none', borderBottom: 'none', borderRight: 'none',
      padding: 20,
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid #333'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8
        }}>
          <span style={{ fontSize: 32 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
              {selectedRoom.name || `${t.room} ${selectedRoom.id}`}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              ID: {selectedRoom.id}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Detail Button */}
      {onEditDetail && (
        <button
          onClick={() => onEditDetail(selectedRoom.id)}
          className="btn-base btn-primary"
          style={{ width: '100%', padding: '10px', marginBottom: 20 }}
        >
          <ImageIcon size={16} />
          {t.editDetail}
          {hasDetail && <span style={{ fontSize: 10, opacity: 0.7 }}>✓</span>}
        </button>
      )}

      {/* Room Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.roomType}
        </label>
        <select
          value={selectedRoom.type}
          onChange={(e) => onUpdateRoom(selectedRoom.id, { type: e.target.value as RoomType })}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginTop: 6,
            backgroundColor: '#252530',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          {ROOM_TYPES.map(type => (
            <option key={type} value={type}>
              {ROOM_TYPE_ICONS[type]} {getRoomTypeName(type, t)}
            </option>
          ))}
        </select>
      </div>

      {/* Zone Selection */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.assignZone}
        </label>
        <select
          value={selectedRoom.zone_id}
          onChange={(e) => onUpdateRoom(selectedRoom.id, { zone_id: parseInt(e.target.value) })}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginTop: 6,
            backgroundColor: '#252530',
            border: '1px solid #444',
            borderRadius: 6,
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          {Object.entries(zones).map(([zoneId, z]) => (
            <option key={zoneId} value={zoneId} style={{ backgroundColor: '#252530' }}>
              {z.name}
            </option>
          ))}
        </select>
        {zone && (
          <div style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: zone.color,
              border: '1px solid #555'
            }} />
            <span style={{ color: '#888', fontSize: 12 }}>
              {zone.color}
            </span>
          </div>
        )}
      </div>

      {/* Position */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.position}
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 6
        }}>
          <div>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>X</label>
            <input
              type="number"
              value={selectedRoom.x}
              onChange={(e) => onUpdateRoom(selectedRoom.id, { x: parseInt(e.target.value) || 0 }, false)}
              onBlur={(e) => onUpdateRoom(selectedRoom.id, { x: parseInt(e.target.value) || 0 }, true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  ; (e.currentTarget as HTMLInputElement).blur()
                }
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#252530',
                border: '1px solid #444',
                borderRadius: 6,
                color: '#fff',
                fontSize: 15,
                marginTop: 4
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Y</label>
            <input
              type="number"
              value={selectedRoom.y}
              onChange={(e) => onUpdateRoom(selectedRoom.id, { y: parseInt(e.target.value) || 0 }, false)}
              onBlur={(e) => onUpdateRoom(selectedRoom.id, { y: parseInt(e.target.value) || 0 }, true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  ; (e.currentTarget as HTMLInputElement).blur()
                }
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#252530',
                border: '1px solid #444',
                borderRadius: 6,
                color: '#fff',
                fontSize: 15,
                marginTop: 4
              }}
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.size}
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 6
        }}>
          <div>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{t.width}</label>
            <input
              type="number"
              value={selectedRoom.w}
              onChange={(e) => {
                const newW = parseInt(e.target.value) || 1
                // 단일 블록인 경우 rects도 함께 업데이트
                const newRects: [number, number, number, number][] =
                  selectedRoom.rects?.length === 1
                    ? [[0, 0, newW, selectedRoom.h]]
                    : selectedRoom.rects || [[0, 0, newW, selectedRoom.h]]
                onUpdateRoom(selectedRoom.id, { w: newW, rects: newRects }, false)
              }}
              onBlur={(e) => {
                const newW = parseInt(e.target.value) || 1
                const newRects: [number, number, number, number][] =
                  selectedRoom.rects?.length === 1
                    ? [[0, 0, newW, selectedRoom.h]]
                    : selectedRoom.rects || [[0, 0, newW, selectedRoom.h]]
                onUpdateRoom(selectedRoom.id, { w: newW, rects: newRects }, true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  ; (e.currentTarget as HTMLInputElement).blur()
                }
              }}
              min={1}
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#252530',
                border: '1px solid #444',
                borderRadius: 6,
                color: '#fff',
                fontSize: 15,
                marginTop: 4
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{t.height}</label>
            <input
              type="number"
              value={selectedRoom.h}
              onChange={(e) => {
                const newH = parseInt(e.target.value) || 1
                // 단일 블록인 경우 rects도 함께 업데이트
                const newRects: [number, number, number, number][] =
                  selectedRoom.rects?.length === 1
                    ? [[0, 0, selectedRoom.w, newH]]
                    : selectedRoom.rects || [[0, 0, selectedRoom.w, newH]]
                onUpdateRoom(selectedRoom.id, { h: newH, rects: newRects }, false)
              }}
              onBlur={(e) => {
                const newH = parseInt(e.target.value) || 1
                const newRects: [number, number, number, number][] =
                  selectedRoom.rects?.length === 1
                    ? [[0, 0, selectedRoom.w, newH]]
                    : selectedRoom.rects || [[0, 0, selectedRoom.w, newH]]
                onUpdateRoom(selectedRoom.id, { h: newH, rects: newRects }, true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  ; (e.currentTarget as HTMLInputElement).blur()
                }
              }}
              min={1}
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#252530',
                border: '1px solid #444',
                borderRadius: 6,
                color: '#fff',
                fontSize: 15,
                marginTop: 4
              }}
            />
          </div>
        </div>
        {selectedRoom.rects && selectedRoom.rects.length > 1 && (
          <div style={{
            marginTop: 6,
            fontSize: 10,
            color: '#888'
          }}>
            ⚠️ 복합 블록은 크기 변경 시 rects가 유지됩니다
          </div>
        )}
      </div>

      {/* Depth */}
      {selectedRoom.depth !== undefined && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            {t.depthFromStart}
          </label>
          <div style={{
            marginTop: 6,
            padding: '10px 12px',
            backgroundColor: '#252530',
            borderRadius: 6,
            color: '#fff',
            fontSize: 14
          }}>
            {selectedRoom.depth} {t.steps}
          </div>
        </div>
      )}

      {/* Connections */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.connections}
        </label>
        <div style={{
          marginTop: 6,
          padding: '10px 12px',
          backgroundColor: '#252530',
          borderRadius: 6,
          color: '#fff',
          fontSize: 14
        }}>
          {selectedRoom.neighbors?.length || 0} {t.neighbors}
        </div>
      </div>

      {/* Rects Info & Split Button */}
      {selectedRoom.rects && selectedRoom.rects.length > 1 && onSplitRoom && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            복합 블록
          </label>
          <div style={{
            marginTop: 6,
            padding: '10px 12px',
            backgroundColor: '#3d2963',
            borderRadius: 6,
            color: '#a78bfa',
            fontSize: 12,
            marginBottom: 8
          }}>
            ⚠️ 이 방은 {selectedRoom.rects.length}개의 블록으로 구성됨
          </div>
          <button
            onClick={() => onSplitRoom(selectedRoom.id)}
            className="btn-base btn-primary"
            style={{ width: '100%', padding: '10px', backgroundColor: 'var(--accent-indigo)', color: '#fff' }}
          >
            <Scissors size={14} />
            {t.splitRoom}
          </button>
          <div style={{
            marginTop: 6,
            fontSize: 10,
            color: '#666',
            textAlign: 'center'
          }}>
            {t.splitRoomHint}
          </div>
        </div>
      )}

      {/* Delete Button */}
      <button
        onClick={() => onDeleteRoom(selectedRoom.id)}
        className="btn-base btn-danger"
        style={{ width: '100%', padding: '10px', marginTop: 20 }}
      >
        <Trash2 size={16} />
        {t.deleteRoom}
      </button>
    </div>
  )
}
