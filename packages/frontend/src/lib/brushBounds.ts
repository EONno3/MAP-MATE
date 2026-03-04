export interface SquareBrushBounds {
  startX: number
  startY: number
  endX: number
  endY: number
}

/**
 * 브러시 크기(size)를 "한 변의 길이"로 해석해 정사각형 영역을 만든다.
 * - size=1 => 1x1
 * - size=2 => 2x2 (기존 halfBrush 방식의 3x3 문제 해결)
 *
 * 중심이 모호한 짝수 size는 "중심이 hovered tile과 그 우하단 사이"에 있다고 보고,
 * start = x - floor((size-1)/2) 로 결정한다.
 */
export function getSquareBrushBounds({
  x,
  y,
  size,
  maxX,
  maxY,
}: {
  x: number
  y: number
  size: number
  maxX: number
  maxY: number
}): SquareBrushBounds {
  const s = Math.max(1, Math.floor(size))

  let startX = x - Math.floor((s - 1) / 2)
  let startY = y - Math.floor((s - 1) / 2)
  let endX = startX + s - 1
  let endY = startY + s - 1

  // Clamp to available tile range (shrink near edges)
  startX = Math.max(0, Math.min(maxX, startX))
  startY = Math.max(0, Math.min(maxY, startY))
  endX = Math.max(0, Math.min(maxX, endX))
  endY = Math.max(0, Math.min(maxY, endY))

  // In case clamping inverted, normalize
  if (endX < startX) [startX, endX] = [endX, startX]
  if (endY < startY) [startY, endY] = [endY, startY]

  return { startX, startY, endX, endY }
}

