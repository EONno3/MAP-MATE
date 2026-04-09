// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnsavedChangesDialog } from '../src/components/room-editor/UnsavedChangesDialog'
import { translations } from '../src/i18n/translations'

describe('UnsavedChangesDialog', () => {
  afterEach(() => cleanup())

  it('열려있을 때 안내 문구와 3개 버튼이 보인다', () => {
    render(
      <UnsavedChangesDialog
        isOpen
        title={translations.ko.unsavedChangesDialogTitle}
        description={translations.ko.unsavedChangesDialogDescription}
        stayLabel={translations.ko.unsavedChangesDialogStayEditing}
        leaveWithoutSavingLabel={translations.ko.unsavedChangesDialogLeaveWithoutSaving}
        saveAndLeaveLabel={translations.ko.unsavedChangesDialogSaveAndLeave}
        onStay={vi.fn()}
        onLeaveWithoutSaving={vi.fn()}
        onSaveAndLeave={vi.fn()}
      />
    )

    expect(screen.getByText(translations.ko.unsavedChangesDialogTitle)).toBeTruthy()
    expect(screen.getByText(translations.ko.unsavedChangesDialogDescription)).toBeTruthy()
    expect(screen.getByRole('button', { name: translations.ko.unsavedChangesDialogStayEditing })).toBeTruthy()
    expect(screen.getByRole('button', { name: translations.ko.unsavedChangesDialogLeaveWithoutSaving })).toBeTruthy()
    expect(screen.getByRole('button', { name: translations.ko.unsavedChangesDialogSaveAndLeave })).toBeTruthy()
  })

  it('각 버튼 클릭 시 콜백이 호출된다', async () => {
    const user = userEvent.setup()
    const onStay = vi.fn()
    const onLeaveWithoutSaving = vi.fn()
    const onSaveAndLeave = vi.fn()

    render(
      <UnsavedChangesDialog
        isOpen
        title="t"
        description="d"
        stayLabel="계속 편집"
        leaveWithoutSavingLabel="저장하지 않고 나가기"
        saveAndLeaveLabel="저장 후 나가기"
        onStay={onStay}
        onLeaveWithoutSaving={onLeaveWithoutSaving}
        onSaveAndLeave={onSaveAndLeave}
      />
    )

    await user.click(screen.getByRole('button', { name: '계속 편집' }))
    expect(onStay).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '저장하지 않고 나가기' }))
    expect(onLeaveWithoutSaving).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '저장 후 나가기' }))
    expect(onSaveAndLeave).toHaveBeenCalledTimes(1)
  })

  it('닫혀있으면 아무것도 렌더링하지 않는다', () => {
    render(
      <UnsavedChangesDialog
        isOpen={false}
        title="t"
        description="d"
        stayLabel="계속 편집"
        leaveWithoutSavingLabel="저장하지 않고 나가기"
        saveAndLeaveLabel="저장 후 나가기"
        onStay={vi.fn()}
        onLeaveWithoutSaving={vi.fn()}
        onSaveAndLeave={vi.fn()}
      />
    )
    expect(screen.queryByText('t')).toBeNull()
  })
})

