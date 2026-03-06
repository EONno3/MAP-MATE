import React, { useEffect, useState, useRef } from 'react';
import { useTutorialInterceptor } from '../hooks/useTutorialInterceptor';
import { tutorialTranslations, Language } from '../i18n/tutorialTranslations';

interface TutorialOverlayProps {
    isActive: boolean;
    onExit: () => void;
    language: Language;
}

interface TargetInfo {
    rect: DOMRect;
    key: string;
}

export function TutorialOverlay({ isActive, onExit, language }: TutorialOverlayProps) {
    const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);

    // Reference to the currently hovered element so we can restore its title when the mouse leaves.
    const currentHoveredElement = useRef<HTMLElement | null>(null);

    useTutorialInterceptor(isActive, onExit);

    useEffect(() => {
        if (!isActive) {
            // Clean up when deactivated
            if (currentHoveredElement.current) {
                const title = currentHoveredElement.current.getAttribute('data-original-title');
                if (title !== null) {
                    currentHoveredElement.current.setAttribute('title', title);
                    currentHoveredElement.current.removeAttribute('data-original-title');
                }
                currentHoveredElement.current = null;
            }
            setTargetInfo(null);
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            // Try to find an element with data-tutorial under the mouse
            const target = (e.target as HTMLElement).closest('[data-tutorial]') as HTMLElement;

            // Handle element changes
            if (currentHoveredElement.current && currentHoveredElement.current !== target) {
                // Restore title of the previous element
                const oldTitle = currentHoveredElement.current.getAttribute('data-original-title');
                if (oldTitle !== null) {
                    currentHoveredElement.current.setAttribute('title', oldTitle);
                    currentHoveredElement.current.removeAttribute('data-original-title');
                }
                currentHoveredElement.current = null;
            }

            if (target) {
                // Suppress native title to prevent overlapping tooltips
                if (target.hasAttribute('title')) {
                    const title = target.getAttribute('title');
                    if (title) {
                        target.setAttribute('data-original-title', title);
                        target.removeAttribute('title');
                    }
                }
                currentHoveredElement.current = target;

                const key = target.getAttribute('data-tutorial');
                const rect = target.getBoundingClientRect();

                if (key) {
                    setTargetInfo({ rect, key });
                }
            } else {
                setTargetInfo(null);
            }
        };

        window.addEventListener('mousemove', handleMouseMove, { capture: true, passive: true });

        // Also periodically recalculate the bounding rect in case the layout shifts or window resizes
        const intervalId = setInterval(() => {
            if (currentHoveredElement.current) {
                const newRect = currentHoveredElement.current.getBoundingClientRect();
                // Only update state if it actually moved/resized to avoid unnecessary renders
                setTargetInfo(prev => {
                    if (!prev) return prev;
                    if (
                        prev.rect.x === newRect.x &&
                        prev.rect.y === newRect.y &&
                        prev.rect.width === newRect.width &&
                        prev.rect.height === newRect.height
                    ) {
                        return prev;
                    }
                    return { rect: newRect, key: prev.key };
                });
            }
        }, 100);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove, { capture: true });
            clearInterval(intervalId);
        };
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                pointerEvents: 'none', // Critical: Let mouse events fall through
            }}
        >
            {/* Semi-transparent background that dims everything slightly except the target via a trick or just uniformly. 
          Actually, drawing a box-shadow around the highlight element is a cleaner way to achieve a "focus" effect. */}

            {targetInfo && (
                <>
                    {/* Highlight Box */}
                    <div
                        style={{
                            position: 'absolute',
                            top: targetInfo.rect.top - 4,
                            left: targetInfo.rect.left - 4,
                            width: targetInfo.rect.width + 8,
                            height: targetInfo.rect.height + 8,
                            border: '2px solid var(--accent-blue)',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', // Dims everything else
                            transition: 'all 0.15s ease-out',
                        }}
                    />

                    {/* Tooltip Popup */}
                    <div
                        style={{
                            position: 'absolute',
                            // Place tooltip below the element. If it goes off-screen, a more advanced calculation is needed, 
                            // but for now simple placement is fine.
                            top: targetInfo.rect.bottom + 12,
                            left: Math.max(16, Math.min(window.innerWidth - 300, targetInfo.rect.left)),
                            backgroundColor: 'var(--bg-panel)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            color: 'var(--text-main)',
                            fontSize: '14px',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            maxWidth: '320px',
                            zIndex: 10000,
                            pointerEvents: 'auto', // Allow the tooltip itself to block events strictly inside it, though the overlay interceptor catches them anyway.
                            animation: 'tooltipFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {tutorialTranslations[language][targetInfo.key] || `No tutorial text found for [${targetInfo.key}]`}
                    </div>
                </>
            )}

            {/* Global Instructions overlay (Always visible while mode is on) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--bg-overlay, rgba(30, 30, 30, 0.9))',
                    padding: '12px 24px',
                    borderRadius: '30px',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    border: '1px solid var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <span style={{ fontSize: 18 }}>💡</span>
                {language === 'ko'
                    ? '튜토리얼 모드 작동 중: 버튼 위에 마우스를 올리세요. 종료하려면 ESC 키를 누르세요.'
                    : 'Tutorial Mode Active: Hover over buttons. Press ESC to exit.'}
            </div>

            <style>
                {`
          @keyframes tooltipFadeIn {
            from {
              opacity: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
            </style>
        </div>
    );
}
