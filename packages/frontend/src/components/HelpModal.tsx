import React, { useEffect, useState } from 'react'
import { Translations } from '../i18n/translations'
import { HelpCircle, X, Keyboard, Mouse } from 'lucide-react'

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
                    {/* World Map Section */}
                    <section>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent-indigo)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Mouse size={18} /> 월드맵 조작
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr', gap: '12px 24px', fontSize: 14 }}>
                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>좌클릭</kbd></div>
                            <div>방학/방 선택, 방 드래그 이동</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>Space</kbd> + <kbd style={kbdStyle}>좌클릭</kbd> 드래그</div>
                            <div>화면 패닝(이동) (Shift+클릭, 우클릭 드래그도 가능)</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>휠 스크롤</kbd></div>
                            <div>화면 줌 인/줌 아웃</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>더블 클릭</kbd></div>
                            <div>(방 위에서) 방 상세 에디터 열기</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>Delete</kbd></div>
                            <div>선택된 방 또는 연결(Connection) 삭제</div>
                        </div>
                    </section>

                    <div style={{ height: 1, backgroundColor: 'var(--border-light)' }} />

                    {/* Room Editor Section */}
                    <section>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent-green)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Keyboard size={18} /> 방 상세 에디터
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr', gap: '12px 24px', fontSize: 14 }}>
                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>1</kbd></div>
                            <div>타일 모드 전환</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>1</kbd> 길게 누르기</div>
                            <div>타일 방사형(Radial) 휠 메뉴 열기</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>2</kbd></div>
                            <div>오브젝트 모드 전환</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>2</kbd> 길게 누르기</div>
                            <div>오브젝트 방사형(Radial) 휠 메뉴 열기</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>B</kbd></div>
                            <div>브러시 도구 선택</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>G</kbd> / <kbd style={kbdStyle}>F</kbd></div>
                            <div>채우기 도구 선택</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>E</kbd></div>
                            <div>지우개 도구 선택 (빈 타일 + 브러시)</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>Space</kbd> + <kbd style={kbdStyle}>좌클릭</kbd> 드래그</div>
                            <div>화면 패닝(이동)</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>Alt</kbd> + <kbd style={kbdStyle}>1~9</kbd></div>
                            <div>타일 팔레트 항목 빠른 선택</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>Z</kbd></div>
                            <div>실행 취소 (Undo)</div>

                            <div style={{ color: 'var(--text-muted)' }}><kbd style={kbdStyle}>Ctrl</kbd> + <kbd style={kbdStyle}>Y</kbd></div>
                            <div>다시 실행 (Redo)</div>
                        </div>
                    </section>
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
