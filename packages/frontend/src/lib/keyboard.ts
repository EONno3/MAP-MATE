export function isTextEditingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable) return true

  const tag = (el.tagName || '').toUpperCase()
  if (tag === 'TEXTAREA') return true

  if (tag === 'INPUT') {
    const type = ((el as HTMLInputElement).type || 'text').toLowerCase()
    return ['text', 'search', 'email', 'password', 'url', 'tel'].includes(type)
  }

  return false
}

export function isInputOrTextAreaTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = (el.tagName || '').toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA'
}

export function isInputTextAreaOrSelectTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = (el.tagName || '').toUpperCase()
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function isCtrlOrCmdPressed(e: { ctrlKey?: boolean; metaKey?: boolean } | null | undefined): boolean {
  if (!e) return false
  return !!(e.ctrlKey || e.metaKey)
}

