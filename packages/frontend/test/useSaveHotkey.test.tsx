// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { useSaveHotkey } from '../src/hooks/useSaveHotkey'

function TestHarness({ onSave, enabled = true }: { onSave: () => void; enabled?: boolean }) {
  useSaveHotkey({ enabled, onSave })
  return <div>ok</div>
}

describe('useSaveHotkey', () => {
  afterEach(() => cleanup())

  it('Ctrl+S는 preventDefault 되고 onSave가 호출된다', () => {
    const onSave = vi.fn()
    render(<TestHarness onSave={onSave} />)

    const ev = new KeyboardEvent('keydown', { ctrlKey: true, code: 'KeyS', bubbles: true, cancelable: true })
    window.dispatchEvent(ev)

    expect(ev.defaultPrevented).toBe(true)
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('텍스트 입력 중(input)에는 Ctrl+S를 가로채지 않는다', () => {
    const onSave = vi.fn()
    render(<TestHarness onSave={onSave} />)

    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)
    input.focus()

    const ev = new KeyboardEvent('keydown', { ctrlKey: true, code: 'KeyS', bubbles: true, cancelable: true })
    input.dispatchEvent(ev)

    expect(ev.defaultPrevented).toBe(false)
    expect(onSave).toHaveBeenCalledTimes(0)
  })

  it('enabled=false면 Ctrl+S를 처리하지 않는다', () => {
    const onSave = vi.fn()
    render(<TestHarness onSave={onSave} enabled={false} />)

    const ev = new KeyboardEvent('keydown', { ctrlKey: true, code: 'KeyS', bubbles: true, cancelable: true })
    window.dispatchEvent(ev)

    expect(ev.defaultPrevented).toBe(false)
    expect(onSave).toHaveBeenCalledTimes(0)
  })
})

