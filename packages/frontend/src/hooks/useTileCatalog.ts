import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Translations } from '../i18n/translations'
import { translations } from '../i18n/translations'
import { TILE_COLORS, type TileType } from '../types/map'
import {
  addCustomTileKey,
  createDefaultTileCatalogState,
  normalizeTileCatalogState,
  TILE_CATALOG_STORAGE_KEY,
  removeCustomTileKey,
  removeTileOverride,
  upsertTileOverrideColor,
  upsertTileOverrideName,
  type TileCatalogStateV1,
} from '../lib/tileCatalogState'

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function loadState(): TileCatalogStateV1 {
  if (typeof window === 'undefined') return createDefaultTileCatalogState()
  const raw = window.localStorage.getItem(TILE_CATALOG_STORAGE_KEY)
  if (!raw) return createDefaultTileCatalogState()
  return normalizeTileCatalogState(safeParseJson(raw))
}

function saveState(state: TileCatalogStateV1) {
  try {
    window.localStorage.setItem(TILE_CATALOG_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

function getBuiltinLabel(tile: TileType, t: Translations): string {
  switch (tile) {
    case 'empty':
      return t.tileEmpty
    case 'solid':
      return t.tileSolid
    case 'platform':
      return t.tilePlatform
    case 'spike':
      return t.tileSpike
    case 'acid':
      return t.tileAcid
    case 'breakable':
      return t.tileBreakable
    case 'door':
      return t.tileDoor
    default:
      return String(tile)
  }
}

export interface TileCatalogItem {
  key: string
  label: string
  color: string
  isBuiltin: boolean
}

export interface TileCatalogApi {
  state: TileCatalogStateV1
  items: TileCatalogItem[]
  paletteTiles: string[]
  getColor: (key: string) => string
  getLabel: (key: string) => string
  setTileColor: (key: string, color: string) => void
  setTileName: (key: string, name: string) => void
  addTile: (input: { color?: string; name?: string }) => string
  deleteTile: (key: string) => void
  resetTileCatalog: () => void
  importTileCatalogState: (next: unknown) => void
}

export function useTileCatalog(params: { t: Translations }): TileCatalogApi {
  const { t } = params
  const [state, setState] = useState<TileCatalogStateV1>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const builtinKeys = useMemo(() => Object.keys(TILE_COLORS) as TileType[], [])

  const getColor = useCallback(
    (key: string): string => {
      const override = state.overrides[key]?.color
      if (override) return override
      return (TILE_COLORS as any)[key] ?? '#888888'
    },
    [state.overrides]
  )

  const getLabel = useCallback(
    (key: string): string => {
      const name = state.overrides[key]?.name
      const overrideLabel = name?.ko
      if (overrideLabel) return overrideLabel
      // 기본 타일명은 한국어로 고정(언어 토글 제거)
      if ((TILE_COLORS as any)[key] !== undefined) return getBuiltinLabel(key as TileType, translations.ko)
      return key
    },
    [state.overrides]
  )

  const items: TileCatalogItem[] = useMemo(() => {
    const keys = [...builtinKeys, ...state.customKeys]
    return keys.map((k) => ({
      key: k,
      label: getLabel(k),
      color: getColor(k),
      isBuiltin: builtinKeys.includes(k as TileType),
    }))
  }, [builtinKeys, state.customKeys, getLabel, getColor])

  const paletteTiles = useMemo(() => items.map((it) => it.key), [items])

  const setTileColor = useCallback((key: string, color: string) => {
    setState((prev) => upsertTileOverrideColor(prev, key, color))
  }, [])

  const setTileName = useCallback((key: string, name: string) => {
    setState((prev) => upsertTileOverrideName(prev, key, { ko: name }))
  }, [])

  const addTile = useCallback((input: { color?: string; name?: string }) => {
    const seed = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    let key = seed
    const existing = new Set<string>([...builtinKeys, ...state.customKeys, ...Object.keys(state.overrides)])
    while (existing.has(key)) {
      key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }

    setState((prev) => {
      let next = addCustomTileKey(prev, key)
      if (input.color) next = upsertTileOverrideColor(next, key, input.color)
      if (input.name) next = upsertTileOverrideName(next, key, { ko: input.name })
      return next
    })

    return key
  }, [builtinKeys, state.customKeys, state.overrides])

  const deleteTile = useCallback(
    (key: string) => {
      // built-in tiles are not deletable
      if (builtinKeys.includes(key as TileType)) return
      setState((prev) => removeTileOverride(removeCustomTileKey(prev, key), key))
    },
    [builtinKeys]
  )

  const resetTileCatalog = useCallback(() => {
    setState(createDefaultTileCatalogState())
  }, [])

  return {
    state,
    items,
    paletteTiles,
    getColor,
    getLabel,
    setTileColor,
    setTileName,
    addTile,
    deleteTile,
    resetTileCatalog,
    importTileCatalogState: (next: unknown) => setState(normalizeTileCatalogState(next)),
  }
}

