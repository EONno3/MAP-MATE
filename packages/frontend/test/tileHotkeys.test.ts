import { describe, expect, it } from 'vitest'
import { selectTileKeyByDigitHotkey, tileIndexFromDigitKey } from '../src/lib/tileHotkeys'

describe('tileHotkeys', () => {
  it('tileIndexFromDigitKey: 1~9만 인덱스로 변환한다', () => {
    expect(tileIndexFromDigitKey('1')).toBe(0)
    expect(tileIndexFromDigitKey('9')).toBe(8)
    expect(tileIndexFromDigitKey('0')).toBe(null)
    expect(tileIndexFromDigitKey('a')).toBe(null)
  })

  it('selectTileKeyByDigitHotkey: 팔레트 순서에서 타일을 선택한다', () => {
    const tiles = ['a', 'b', 'c']
    expect(selectTileKeyByDigitHotkey(tiles, '1')).toBe('a')
    expect(selectTileKeyByDigitHotkey(tiles, '3')).toBe('c')
    expect(selectTileKeyByDigitHotkey(tiles, '4')).toBe(null)
  })
})

