import { describe, expect, it } from 'vitest'
import { tutorialTranslations } from '../src/i18n/tutorialTranslations'
import fs from 'node:fs'
import path from 'node:path'

function walkFiles(dir: string, exts: Set<string>, out: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      // skip common heavy dirs (none expected under src, but keep it safe)
      if (ent.name === 'node_modules' || ent.name === 'dist') continue
      walkFiles(p, exts, out)
      continue
    }
    const ext = path.extname(ent.name).toLowerCase()
    if (exts.has(ext)) out.push(p)
  }
  return out
}

function collectDataTutorialKeys(srcRoot: string): string[] {
  const files = walkFiles(srcRoot, new Set(['.ts', '.tsx']))
  const keys = new Set<string>()
  const re = /data-tutorial=(?:"([^"]+)"|'([^']+)')/g
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      const key = (m[1] || m[2] || '').trim()
      if (key) keys.add(key)
    }
  }
  return Array.from(keys).sort()
}

describe('tutorialTranslations coverage', () => {
  it('모든 data-tutorial 키가 ko/en 번역을 가진다', () => {
    const srcRoot = path.resolve(__dirname, '../src')
    const usedKeys = collectDataTutorialKeys(srcRoot)

    for (const key of usedKeys) {
      expect(tutorialTranslations.ko[key], `ko missing: ${key}`).toBeTruthy()
      expect(tutorialTranslations.en[key], `en missing: ${key}`).toBeTruthy()
    }
  })

  it('tutorialTranslations에 미사용 키가 남아있지 않다', () => {
    const srcRoot = path.resolve(__dirname, '../src')
    const usedKeys = new Set(collectDataTutorialKeys(srcRoot))

    const koKeys = Object.keys(tutorialTranslations.ko).sort()
    const enKeys = Object.keys(tutorialTranslations.en).sort()

    const unusedKo = koKeys.filter((k) => !usedKeys.has(k))
    const unusedEn = enKeys.filter((k) => !usedKeys.has(k))

    expect(unusedKo, `unused ko keys:\n- ${unusedKo.join('\n- ')}`).toEqual([])
    expect(unusedEn, `unused en keys:\n- ${unusedEn.join('\n- ')}`).toEqual([])
  })
})

