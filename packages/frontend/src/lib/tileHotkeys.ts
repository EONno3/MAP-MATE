export function tileIndexFromDigitKey(key: string): number | null {
  if (key.length !== 1) return null
  const n = Number(key)
  if (!Number.isInteger(n)) return null
  if (n < 1 || n > 9) return null
  return n - 1
}

export function selectTileKeyByDigitHotkey(paletteTiles: string[], key: string): string | null {
  const idx = tileIndexFromDigitKey(key)
  if (idx === null) return null
  return paletteTiles[idx] ?? null
}

