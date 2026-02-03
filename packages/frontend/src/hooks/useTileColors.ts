import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TileType } from '../types/map'
import { TILE_COLORS } from '../types/map'

export type TileColors = Record<TileType, string>

const STORAGE_KEY = 'mapmate_tile_colors_v1'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function loadTileColors(): TileColors {
  if (typeof window === 'undefined') return { ...TILE_COLORS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...TILE_COLORS }
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) return { ...TILE_COLORS }

    const next: TileColors = { ...TILE_COLORS }
    for (const key of Object.keys(TILE_COLORS) as TileType[]) {
      const v = (parsed as any)[key]
      if (typeof v === 'string' && v.length > 0) next[key] = v
    }
    return next
  } catch {
    return { ...TILE_COLORS }
  }
}

function saveTileColors(colors: TileColors) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch {
    // ignore
  }
}

export function useTileColors() {
  const [tileColors, setTileColors] = useState<TileColors>(() => loadTileColors())

  useEffect(() => {
    saveTileColors(tileColors)
  }, [tileColors])

  const setTileColor = useCallback((tile: TileType, color: string) => {
    setTileColors((prev) => ({ ...prev, [tile]: color }))
  }, [])

  const resetTileColors = useCallback(() => {
    setTileColors({ ...TILE_COLORS })
  }, [])

  const paletteTiles = useMemo(() => Object.keys(TILE_COLORS) as TileType[], [])

  return { tileColors, setTileColor, resetTileColors, paletteTiles }
}

