import React, { useEffect, useState, useCallback, useRef } from 'react'

export interface RadialMenuItem {
  id: string
  label: string
  icon?: string
  color?: string
}

interface RadialMenuProps {
  items: RadialMenuItem[]
  position: { x: number; y: number }
  visible: boolean
  onSelect: (id: string) => void
  onClose: () => void
  title?: string
}

const RADIUS = 100 // 휠 반지름
const ITEM_SIZE = 48 // 아이템 크기

export function RadialMenu({ items, position, visible, onSelect, onClose, title }: RadialMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mouseAngle, setMouseAngle] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 마우스 위치로 선택할 아이템 계산
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!visible) return

    const centerX = position.x
    const centerY = position.y
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 중앙 근처면 선택 없음
    if (distance < 30) {
      setHoveredIndex(null)
      return
    }

    // 각도 계산 (0 = 위쪽, 시계방향)
    let angle = Math.atan2(dx, -dy) * (180 / Math.PI)
    if (angle < 0) angle += 360
    setMouseAngle(angle)

    // 아이템 인덱스 계산
    const anglePerItem = 360 / items.length
    const index = Math.floor((angle + anglePerItem / 2) % 360 / anglePerItem)
    setHoveredIndex(index)
  }, [visible, position, items.length])

  // 마우스 업 시 선택
  const handleMouseUp = useCallback(() => {
    if (hoveredIndex !== null && items[hoveredIndex]) {
      onSelect(items[hoveredIndex].id)
    }
    onClose()
  }, [hoveredIndex, items, onSelect, onClose])

  useEffect(() => {
    if (visible) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [visible, handleMouseMove, handleMouseUp])

  // 초기화
  useEffect(() => {
    if (!visible) {
      setHoveredIndex(null)
    }
  }, [visible])

  if (!visible) return null

  const anglePerItem = 360 / items.length

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'all'
      }}
    >
      {/* 반투명 배경 */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }} />

      {/* 휠 컨테이너 */}
      <div style={{
        position: 'absolute',
        left: position.x - RADIUS - ITEM_SIZE / 2,
        top: position.y - RADIUS - ITEM_SIZE / 2,
        width: (RADIUS + ITEM_SIZE / 2) * 2,
        height: (RADIUS + ITEM_SIZE / 2) * 2
      }}>
        {/* 중앙 원 */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: '#1a1a24',
          border: '2px solid #444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10
        }}>
          <span style={{ color: '#888', fontSize: 12, textAlign: 'center' }}>
            {title || '선택'}
          </span>
        </div>

        {/* 선택 표시 (파이 조각) */}
        {hoveredIndex !== null && (
          <svg
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
            viewBox={`0 0 ${(RADIUS + ITEM_SIZE / 2) * 2} ${(RADIUS + ITEM_SIZE / 2) * 2}`}
          >
            <defs>
              <clipPath id="pieClip">
                <circle cx="50%" cy="50%" r={RADIUS + ITEM_SIZE / 2} />
              </clipPath>
            </defs>
            <path
              d={(() => {
                const cx = RADIUS + ITEM_SIZE / 2
                const cy = RADIUS + ITEM_SIZE / 2
                const r = RADIUS + ITEM_SIZE / 2
                const startAngle = (hoveredIndex * anglePerItem - anglePerItem / 2 - 90) * Math.PI / 180
                const endAngle = ((hoveredIndex + 1) * anglePerItem - anglePerItem / 2 - 90) * Math.PI / 180
                
                const x1 = cx + r * Math.cos(startAngle)
                const y1 = cy + r * Math.sin(startAngle)
                const x2 = cx + r * Math.cos(endAngle)
                const y2 = cy + r * Math.sin(endAngle)
                
                const largeArc = anglePerItem > 180 ? 1 : 0
                
                return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
              })()}
              fill="rgba(79, 70, 229, 0.3)"
              stroke="#4f46e5"
              strokeWidth="2"
            />
          </svg>
        )}

        {/* 아이템들 */}
        {items.map((item, index) => {
          const angle = (index * anglePerItem - 90) * Math.PI / 180
          const x = RADIUS * Math.cos(angle)
          const y = RADIUS * Math.sin(angle)
          const isHovered = hoveredIndex === index

          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                borderRadius: '50%',
                // 타일 휠은 "색상만" 보여주기 위해 기본 상태에서도 color를 사용
                backgroundColor: item.color || '#252530',
                border: isHovered ? '2px solid #fff' : '2px solid #444',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                boxShadow: isHovered ? '0 0 20px rgba(79, 70, 229, 0.5)' : 'none',
                zIndex: isHovered ? 20 : 5
              }}
            >
              {item.icon ? <span style={{ fontSize: 20 }}>{item.icon}</span> : null}
            </div>
          )
        })}

        {/* 선택된 아이템 라벨 */}
        {hoveredIndex !== null && items[hoveredIndex] && (
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: -40,
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            backgroundColor: '#1a1a24',
            borderRadius: 6,
            border: '1px solid #444',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 30
          }}>
            {items[hoveredIndex].icon ? `${items[hoveredIndex].icon} ` : ''}{items[hoveredIndex].label}
          </div>
        )}
      </div>
    </div>
  )
}

