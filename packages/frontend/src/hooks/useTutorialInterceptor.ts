import { useEffect } from 'react';

/**
 * useTutorialInterceptor
 * 
 * A hook that takes over global browser events during Tutorial Mode.
 * It strictly blocks all interactions (clicks, panning, zooming, hotkeys) 
 * so that the user can explore the UI safely without modifying the map.
 * 
 * It allows the 'Escape' key to bypass the block so the mode can be exited.
 */
export function useTutorialInterceptor(isActive: boolean, onExit: () => void) {
    useEffect(() => {
        if (!isActive) return;

        const blockEvent = (e: Event) => {
            // Allow specific events to bypass if needed (e.g., custom events or clicking the exit button)
            // Since our toggle button handles its own state, we might need a way to bypass it via a data attribute.
            if (e.target instanceof Element && e.target.closest('[data-tutorial-bypass]')) {
                return;
            }

            e.stopPropagation();
            e.preventDefault();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onExit();
                // Still prevent default Escape behavior (like closing modals in the background)
                e.stopPropagation();
                e.preventDefault();
            } else {
                blockEvent(e);
            }
        };

        // Use { capture: true } to catch events BEFORE they reach any React component
        const options = { capture: true, passive: false };

        window.addEventListener('click', blockEvent, options);
        window.addEventListener('mousedown', blockEvent, options);
        window.addEventListener('mouseup', blockEvent, options);
        window.addEventListener('wheel', blockEvent, options); // Blocks canvas zoom
        window.addEventListener('keydown', handleKeyDown, options); // Blocks hotkeys and canvas pan

        // Specifically block context menu (right click)
        window.addEventListener('contextmenu', blockEvent, options);

        return () => {
            window.removeEventListener('click', blockEvent, options);
            window.removeEventListener('mousedown', blockEvent, options);
            window.removeEventListener('mouseup', blockEvent, options);
            window.removeEventListener('wheel', blockEvent, options);
            window.removeEventListener('keydown', handleKeyDown, options);
            window.removeEventListener('contextmenu', blockEvent, options);
        };
    }, [isActive, onExit]);
}
