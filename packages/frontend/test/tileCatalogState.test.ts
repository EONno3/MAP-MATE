import { describe, expect, it } from 'vitest'
import {
  addCustomTileKey,
  createDefaultTileCatalogState,
  normalizeTileCatalogState,
  removeCustomTileKey,
  removeTileOverride,
  upsertTileOverrideColor,
  upsertTileOverrideName,
} from '../src/lib/tileCatalogState'

describe('tileCatalogState', () => {
  it('normalize: 잘못된 입력이면 기본값으로 폴백한다', () => {
    expect(normalizeTileCatalogState(null)).toEqual(createDefaultTileCatalogState())
    expect(normalizeTileCatalogState({ version: 999 })).toEqual(createDefaultTileCatalogState())
  })

  it('upsertTileOverrideColor: 색상을 저장한다', () => {
    const s0 = createDefaultTileCatalogState()
    const s1 = upsertTileOverrideColor(s0, 'solid', '#123456')
    expect(s1.overrides.solid.color).toBe('#123456')
  })

  it('upsertTileOverrideName: 한국어 이름을 저장한다', () => {
    const s0 = createDefaultTileCatalogState()
    const s1 = upsertTileOverrideName(s0, 'solid', { ko: '벽' })
    expect(s1.overrides.solid.name?.ko).toBe('벽')
  })

  it('addCustomTileKey: 커스텀 타일 키를 순서대로 추가한다', () => {
    const s0 = createDefaultTileCatalogState()
    const s1 = addCustomTileKey(s0, 'custom_a')
    const s2 = addCustomTileKey(s1, 'custom_b')
    expect(s2.customKeys).toEqual(['custom_a', 'custom_b'])
  })

  it('removeCustomTileKey/removeTileOverride: 커스텀/오버라이드를 제거한다', () => {
    const s0 = createDefaultTileCatalogState()
    const s1 = addCustomTileKey(s0, 'custom_a')
    const s2 = upsertTileOverrideName(s1, 'custom_a', { ko: '테스트' })
    expect(s2.customKeys).toEqual(['custom_a'])
    expect(s2.overrides.custom_a.name?.ko).toBe('테스트')

    const s3 = removeTileOverride(removeCustomTileKey(s2, 'custom_a'), 'custom_a')
    expect(s3.customKeys).toEqual([])
    expect(s3.overrides.custom_a).toBeUndefined()
  })
})

