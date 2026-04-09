// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { HelpModal } from '../src/components/HelpModal'
import { translations } from '../src/i18n/translations'

describe('HelpModal (단축키 안내)', () => {
  afterEach(() => cleanup())

  async function openHelpModal() {
    // HelpModal은 useEffect에서 이벤트 리스너를 등록하므로, 한 틱 기다린 뒤 토글 이벤트를 발생시킨다.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    act(() => {
      window.dispatchEvent(new Event('toggle-help-modal'))
    })
  }

  it('월드맵 단축키 안내가 실제 입력 방식과 일치한다', async () => {
    render(<HelpModal t={translations.ko} />)
    await openHelpModal()

    expect(await screen.findByText('월드맵 조작')).toBeTruthy()
    expect(screen.queryByText(/우클릭/)).toBeNull()
    expect(screen.getByText(/휠클릭|가운데/)).toBeTruthy()
    expect(screen.getByText(/빈 공간/)).toBeTruthy()
    expect(screen.getAllByText('Backspace').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cmd').length).toBeGreaterThan(0)
  })

  it('방 상세 에디터 단축키 안내에 저장/Redo 표기가 포함된다', async () => {
    render(<HelpModal t={translations.ko} />)
    await openHelpModal()

    expect(await screen.findByText('방 상세 에디터')).toBeTruthy()
    expect(screen.getByText(/저장/)).toBeTruthy()
    expect(screen.getAllByText('Cmd').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Shift').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Backspace').length).toBeGreaterThan(0)
  })
})

