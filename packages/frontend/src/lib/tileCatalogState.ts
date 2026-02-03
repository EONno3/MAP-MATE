export interface TileNameOverride {
  ko?: string
}

export interface TileOverride {
  color?: string
  name?: TileNameOverride
}

export interface TileCatalogStateV1 {
  version: 1
  customKeys: string[]
  overrides: Record<string, TileOverride>
}

export const TILE_CATALOG_STORAGE_KEY = 'mapmate_tile_catalog_v1'

export function createDefaultTileCatalogState(): TileCatalogStateV1 {
  return { version: 1, customKeys: [], overrides: {} }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

export function normalizeTileCatalogState(input: unknown): TileCatalogStateV1 {
  const base = createDefaultTileCatalogState()
  if (!isRecord(input)) return base
  if ((input as any).version !== 1) return base

  const rawCustomKeys = (input as any).customKeys
  const rawOverrides = (input as any).overrides

  const customKeys: string[] = Array.isArray(rawCustomKeys)
    ? rawCustomKeys.filter((k) => typeof k === 'string' && k.length > 0)
    : []

  const overrides: Record<string, TileOverride> = {}
  if (isRecord(rawOverrides)) {
    for (const [k, v] of Object.entries(rawOverrides)) {
      if (typeof k !== 'string' || k.length === 0) continue
      if (!isRecord(v)) continue

      const next: TileOverride = {}
      if (typeof (v as any).color === 'string' && (v as any).color.length > 0) next.color = (v as any).color

      const name = (v as any).name
      if (isRecord(name)) {
        const nn: TileNameOverride = {}
        if (typeof (name as any).ko === 'string' && (name as any).ko.length > 0) nn.ko = (name as any).ko
        // v1 호환: 과거 데이터에 en이 있어도 무시(타일명은 한국어 단일로 통일)
        if (nn.ko) next.name = nn
      }

      if (next.color || next.name) overrides[k] = next
    }
  }

  return { version: 1, customKeys, overrides }
}

export function upsertTileOverrideColor(state: TileCatalogStateV1, key: string, color: string): TileCatalogStateV1 {
  if (!key) return state
  if (!color) return state
  return {
    ...state,
    overrides: {
      ...state.overrides,
      [key]: { ...state.overrides[key], color },
    },
  }
}

export function upsertTileOverrideName(state: TileCatalogStateV1, key: string, name: TileNameOverride): TileCatalogStateV1 {
  if (!key) return state
  const prevOverride = state.overrides[key]
  const prevKo = prevOverride?.name?.ko
  const nextKoRaw = name.ko

  // If caller didn't specify ko, do nothing
  if (nextKoRaw === undefined) return state

  const nextKo = typeof nextKoRaw === 'string' ? nextKoRaw : ''

  // Empty string -> remove name override
  const nextOverride = { ...(prevOverride ?? {}) } as TileOverride
  if (nextKo.trim().length > 0) {
    nextOverride.name = { ko: nextKo }
  } else {
    delete nextOverride.name
  }

  // No changes
  const nextKoAfter = nextOverride.name?.ko
  if (prevKo === nextKoAfter && prevOverride?.color === nextOverride.color) return state

  // If override becomes empty, remove it entirely
  if (!nextOverride.color && !nextOverride.name) {
    if (!prevOverride) return state
    const { [key]: _removed, ...rest } = state.overrides
    return { ...state, overrides: rest }
  }

  return {
    ...state,
    overrides: {
      ...state.overrides,
      [key]: nextOverride,
    },
  }
}

export function addCustomTileKey(state: TileCatalogStateV1, key: string): TileCatalogStateV1 {
  if (!key) return state
  if (state.customKeys.includes(key)) return state
  return { ...state, customKeys: [...state.customKeys, key] }
}

export function removeCustomTileKey(state: TileCatalogStateV1, key: string): TileCatalogStateV1 {
  if (!key) return state
  if (!state.customKeys.includes(key)) return state
  return { ...state, customKeys: state.customKeys.filter((k) => k !== key) }
}

export function removeTileOverride(state: TileCatalogStateV1, key: string): TileCatalogStateV1 {
  if (!key) return state
  if (!state.overrides[key]) return state
  const { [key]: _removed, ...rest } = state.overrides
  return { ...state, overrides: rest }
}

