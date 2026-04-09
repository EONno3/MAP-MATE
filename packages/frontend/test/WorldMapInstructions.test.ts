import { describe, expect, it } from 'vitest'
import { translations } from '../src/i18n/translations'

describe('translations.instructions (전체맵)', () => {
  it('오래된 Ctrl+클릭 연결 안내가 남아있지 않다', () => {
    expect(translations.ko.instructions).not.toContain('Ctrl+클릭: 다중선택/연결')
    expect(translations.ko.instructions).not.toContain('다중선택/연결')
    expect(translations.en.instructions).not.toContain('Ctrl+Click: Connect')
  })
})

