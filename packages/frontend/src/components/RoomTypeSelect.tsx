import React, { useState, useRef, useEffect } from 'react'
import { RoomType } from '../types/map'
import { Translations, getRoomTypeName } from '../i18n/translations'
import { getRoomTypeIconComponent } from '../lib/iconRenderer'
import { ChevronDown } from 'lucide-react'

interface RoomTypeSelectProps {
    value: RoomType | ''
    onChange: (type: RoomType) => void
    options: RoomType[]
    t: Translations
    placeholder?: string
}

export function RoomTypeSelect({ value, onChange, options, t, placeholder = '-- 유형 선택 --' }: RoomTypeSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const SelectedIcon = value ? getRoomTypeIconComponent(value) : null

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', marginTop: 6 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#252530',
                    border: '1px solid #444',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {SelectedIcon && <SelectedIcon size={16} />}
                    <span>{value ? getRoomTypeName(value, t) : placeholder}</span>
                </div>
                <ChevronDown size={16} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    backgroundColor: '#252530',
                    border: '1px solid #444',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    maxHeight: 250,
                    overflowY: 'auto'
                }}>
                    {!value && placeholder && (
                        <div
                            onClick={() => setIsOpen(false)}
                            style={{
                                padding: '10px 12px',
                                color: '#888',
                                fontSize: 14,
                                cursor: 'pointer',
                                borderBottom: '1px solid #333'
                            }}
                        >
                            {placeholder}
                        </div>
                    )}
                    {options.map((type) => {
                        const Icon = getRoomTypeIconComponent(type)
                        return (
                            <div
                                key={type}
                                onClick={() => {
                                    onChange(type)
                                    setIsOpen(false)
                                }}
                                style={{
                                    padding: '10px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    color: value === type ? '#fff' : '#ccc',
                                    backgroundColor: value === type ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                    if (value !== type) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                                }}
                                onMouseLeave={(e) => {
                                    if (value !== type) e.currentTarget.style.backgroundColor = 'transparent'
                                }}
                            >
                                <Icon size={16} color={value === type ? 'var(--accent-blue)' : 'inherit'} />
                                <span>{getRoomTypeName(type, t)}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
