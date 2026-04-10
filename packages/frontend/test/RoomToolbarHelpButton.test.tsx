// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoomToolbar } from '../src/components/room-editor/RoomToolbar'
import { translations } from '../src/i18n/translations'
import type { Room } from '../src/types/map'

describe('RoomToolbar (상세맵 툴바)', () => {
  afterEach(() => cleanup())

  function createRoom(): Room {
    return {
      id: 1,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      zone_id: 1,
      type: 'start',
      rects: [],
      neighbors: [],
      name: '테스트룸',
    }
  }

  it('도움말/단축키 버튼을 누르면 HelpModal 토글 이벤트를 발생시킨다', async () => {
    const user = userEvent.setup()
    const onHelp = vi.fn()
    window.addEventListener('toggle-help-modal', onHelp)

    render(
      <RoomToolbar
        room={createRoom()}
        zone={{ name: 'Z', color: '#ffffff' }}
        onBack={() => {}}
        onSave={() => {}}
        onReset={() => {}}
        hasUnsavedChanges={false}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        t={translations.ko}
      />
    )

    await user.click(screen.getByTitle('단축키 및 도움말'))
    expect(onHelp).toHaveBeenCalledTimes(1)

    window.removeEventListener('toggle-help-modal', onHelp)
  })
})

