import { useEffect } from 'react'
import { isTextEditingTarget, isCtrlOrCmdPressed } from '../lib/keyboard'

export function useSaveHotkey({ enabled, onSave }: { enabled: boolean; onSave: () => void }) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCtrlOrCmdPressed(e)) return
      if (e.code !== 'KeyS') return
      if (isTextEditingTarget(e.target)) return
      e.preventDefault()
      onSave()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onSave])
}

