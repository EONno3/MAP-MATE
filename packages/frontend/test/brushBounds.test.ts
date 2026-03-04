import { describe, expect, it } from 'vitest'
import { getSquareBrushBounds } from '../src/lib/brushBounds'

describe('getSquareBrushBounds', () => {
  it('size=1이면 1x1 bounds', () => {
    expect(
      getSquareBrushBounds({ x: 10, y: 20, size: 1, maxX: 99, maxY: 99 })
    ).toEqual({ startX: 10, startY: 20, endX: 10, endY: 20 })
  })

  it('size=2이면 2x2 bounds (짝수 크기는 정확히 2칸)', () => {
    expect(
      getSquareBrushBounds({ x: 10, y: 20, size: 2, maxX: 99, maxY: 99 })
    ).toEqual({ startX: 10, startY: 20, endX: 11, endY: 21 })
  })

  it('size=4이면 4x4 bounds', () => {
    expect(
      getSquareBrushBounds({ x: 10, y: 20, size: 4, maxX: 99, maxY: 99 })
    ).toEqual({ startX: 9, startY: 19, endX: 12, endY: 22 })
  })

  it('경계 밖은 클램프되어 줄어든다', () => {
    expect(
      getSquareBrushBounds({ x: 0, y: 0, size: 4, maxX: 2, maxY: 2 })
    ).toEqual({ startX: 0, startY: 0, endX: 2, endY: 2 })
  })
})

