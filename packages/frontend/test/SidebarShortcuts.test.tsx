// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Sidebar } from '../src/components/Sidebar'
import { translations } from '../src/i18n/translations'
import type { Room } from '../src/types/map'

function room(id: number): Room {
  return {
    id,
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    zone_id: 1,
    type: 'normal',
    rects: [[0, 0, 4, 4]],
    neighbors: [],
    name: `R${id}`,
  }
}

describe('Sidebar (단축키 안내)', () => {
  afterEach(() => cleanup())

  it('다중 선택 모드에서 Ctrl/Cmd 표기 단축키가 보인다', () => {
    render(
      <Sidebar
        selectedRoom={null}
        selectedRoomIds={[1, 2]}
        zone={null}
        zones={{ 1: { name: 'Z1', color: '#fff' } }}
        selectedConnection={null}
        connections={[]}
        rooms={[room(1), room(2)]}
        clipboard={[]}
        onUpdateRoom={vi.fn()}
        onUpdateSelectedRooms={vi.fn()}
        onDeleteRoom={vi.fn()}
        onDeleteSelectedRooms={vi.fn()}
        onDeleteConnection={vi.fn()}
        onUpdateConnection={vi.fn()}
        onEditDetail={vi.fn()}
        onSplitRoom={vi.fn()}
        onCopySelectedRooms={vi.fn()}
        onPasteRooms={vi.fn()}
        t={translations.ko}
      />
    )

    expect(screen.getByText(/Ctrl\/Cmd\+A/)).toBeTruthy()
    expect(screen.getByText(/Ctrl\/Cmd\+C:\s*복사/)).toBeTruthy()
    expect(screen.getByText(/Ctrl\/Cmd\+V:\s*붙여넣기/)).toBeTruthy()
  })

  it('선택이 없을 때도 Ctrl/Cmd 기반 단축키가 보인다', () => {
    render(
      <Sidebar
        selectedRoom={null}
        selectedRoomIds={[]}
        zone={null}
        zones={{ 1: { name: 'Z1', color: '#fff' } }}
        selectedConnection={null}
        connections={[]}
        rooms={[room(1)]}
        clipboard={[]}
        onUpdateRoom={vi.fn()}
        onUpdateSelectedRooms={vi.fn()}
        onDeleteRoom={vi.fn()}
        onDeleteSelectedRooms={vi.fn()}
        onDeleteConnection={vi.fn()}
        onUpdateConnection={vi.fn()}
        onEditDetail={vi.fn()}
        onSplitRoom={vi.fn()}
        onCopySelectedRooms={vi.fn()}
        onPasteRooms={vi.fn()}
        t={translations.ko}
      />
    )

    expect(screen.getByText(/Ctrl\/Cmd\+S:\s*퀵 저장/)).toBeTruthy()
    expect(screen.getByText(/Ctrl\/Cmd\+Z/)).toBeTruthy()
    expect(screen.getByText(/Ctrl\/Cmd\+클릭/)).toBeTruthy()
  })
})

