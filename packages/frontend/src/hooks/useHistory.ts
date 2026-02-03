import { useState, useCallback } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
  checkpoint: T | null  // 드래그 시작 시점의 상태 저장
}

interface UseHistoryReturn<T> {
  state: T
  set: (newState: T, recordHistory?: boolean) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  commit: () => void
  clear: () => void
  reset: (newState: T) => void
  history: HistoryState<T>
}

const MAX_HISTORY_SIZE = 50

export function useHistory<T>(initialState: T): UseHistoryReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
    checkpoint: null
  })

  // Set new state (with optional history recording)
  // recordHistory: true = 히스토리에 기록 (스트로크 종료 시)
  // recordHistory: false = 화면만 업데이트 (드래그 중)
  const set = useCallback((newState: T, recordHistory: boolean = true) => {
    setHistory(prev => {
      if (recordHistory) {
        // 스트로크 종료: checkpoint가 있으면 그것을 past에 추가 (드래그 시작 시점의 상태)
        // checkpoint가 없으면 현재 present를 추가 (일반적인 상태 변경)
        const stateToSave = prev.checkpoint !== null ? prev.checkpoint : prev.present
        const newPast = [...prev.past, stateToSave].slice(-MAX_HISTORY_SIZE)
        return {
          past: newPast,
          present: newState,
          future: [], // Clear future on new action
          checkpoint: null // checkpoint 초기화
        }
      } else {
        // 드래그 중: checkpoint가 없으면 현재 present를 checkpoint로 저장 (시작 시점)
        // 이후 드래그 중에는 checkpoint 유지, present만 업데이트
        return {
          ...prev,
          present: newState,
          checkpoint: prev.checkpoint !== null ? prev.checkpoint : prev.present
        }
      }
    })
  }, [])

  // Undo
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev

      const newPast = prev.past.slice(0, -1)
      const newPresent = prev.past[prev.past.length - 1]
      const newFuture = [prev.present, ...prev.future]

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
        checkpoint: null // undo 시 진행 중인 드래그 취소
      }
    })
  }, [])

  // Redo
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev

      const newFuture = prev.future.slice(1)
      const newPresent = prev.future[0]
      const newPast = [...prev.past, prev.present]

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
        checkpoint: null // redo 시 진행 중인 드래그 취소
      }
    })
  }, [])

  // Commit an in-progress checkpoint (recordHistory=false) without changing present.
  // Useful when an input unmounts before onBlur can call set(..., true).
  const commit = useCallback(() => {
    setHistory(prev => {
      if (prev.checkpoint === null) return prev
      const newPast = [...prev.past, prev.checkpoint].slice(-MAX_HISTORY_SIZE)
      return {
        past: newPast,
        present: prev.present,
        future: [], // new action should invalidate redo stack
        checkpoint: null
      }
    })
  }, [])

  // Clear history
  const clear = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: [],
      checkpoint: null
    }))
  }, [])

  // Reset history to a new present state (no checkpoint)
  // Use when loading/importing to avoid saving a stale checkpoint.
  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
      checkpoint: null
    })
  }, [])

  // NOTE: Keyboard shortcuts removed from here to prevent conflicts
  // Each component should handle its own undo/redo via the undo() and redo() callbacks

  return {
    state: history.present,
    set,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    commit,
    clear,
    reset,
    history
  }
}



