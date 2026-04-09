import React, { useEffect, useState } from 'react'
import { Translations } from '../i18n/translations'
import { HelpCircle, X, Keyboard, Mouse } from 'lucide-react'
import { ROOM_EDITOR_HELP_SECTION, WORLD_MAP_HELP_SECTION, type ShortcutSection } from '../lib/shortcutCatalog'

interface HelpModalProps {
    t: Translations
}

export function HelpModal({ t }: HelpModalProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev)
        const handleClose = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }

        window.addEventListener('toggle-help-modal', handleToggle)
        window.addEventListener('keydown', handleClose)

        return () => {
            window.removeEventListener('toggle-help-modal', handleToggle)
            window.removeEventListener('keydown', handleClose)
        }
    }, [])

    if (!isOpen) return null

    const sections: Array<{ headerIcon: React.ReactNode; section: ShortcutSection; color: string }> = [
        { headerIcon: <Mouse size={18} />, section: WORLD_MAP_HELP_SECTION, color: 'var(--accent-indigo)' },
        { headerIcon: <Keyboard size={18} />, section: ROOM_EDITOR_HELP_SECTION, color: 'var(--accent-green)' },
    ]

    return (
        <div
            className="animate-fade-in"
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20
            }}
            onClick={() => setIsOpen(false)}
        >
            <div
                className="panel-base animate-slide-up"
                style={{
                    width: '100%',
                    maxWidth: 600,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: 32,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-main)' }}>
                        <HelpCircle size={28} color="var(--accent-blue)" />
                        키보드 및 마우스 단축키안내
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="btn-icon"
                        style={{ padding: 8 }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'grid', gap: 24 }}>
                    {sections.map((it, idx) => (
                        <React.Fragment key={it.section.title}>
                            <section>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: it.color, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {it.headerIcon} {it.section.title}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr', gap: '12px 24px', fontSize: 14 }}>
                                    {it.section.rows.map((row) => (
                                        <React.Fragment key={`${it.section.title}:${row.label}:${row.description}`}>
                                            <div style={{ color: 'var(--text-muted)' }}>
                                                {renderShortcutLabelAsKbd(row.label)}
                                            </div>
                                            <div>{row.description}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </section>
                            {idx < sections.length - 1 && <div style={{ height: 1, backgroundColor: 'var(--border-light)' }} />}
                        </React.Fragment>
                    ))}
                </div>

                <div style={{ marginTop: 32, textAlign: 'center' }}>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="btn-base btn-primary"
                        style={{ padding: '10px 32px', fontSize: 14 }}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    )
}

const kbdStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-panel-hover)',
    border: '1px solid var(--border-light)',
    borderRadius: 4,
    padding: '2px 6px',
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'var(--text-main)',
    boxShadow: '0 2px 0 rgba(0,0,0,0.2)'
}

function renderShortcutLabelAsKbd(label: string) {
    // label 표기 규칙은 shortcutCatalog.ts에서 강제한다.
    // " / "와 " + "로 나눈 토큰 단위로 <kbd>를 렌더링한다.
    const parts = label.split(' + ')
    return (
        <>
            {parts.map((part, idx) => {
                const alts = part.split(' / ')
                return (
                    <React.Fragment key={`${label}:${idx}`}>
                        {alts.map((alt, altIdx) => (
                            <React.Fragment key={`${label}:${idx}:${altIdx}`}>
                                <kbd style={kbdStyle}>{alt}</kbd>
                                {altIdx < alts.length - 1 ? ' / ' : null}
                            </React.Fragment>
                        ))}
                        {idx < parts.length - 1 ? ' + ' : null}
                    </React.Fragment>
                )
            })}
        </>
    )
}
