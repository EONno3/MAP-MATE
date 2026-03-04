import { describe, expect, it } from 'vitest'
import { getMapInteractionNotice, getMapInteractionState } from '../src/lib/interactionState'
import { MapData } from '../src/types/map'
import { translations } from '../src/i18n/translations'

const minimalMapData: MapData = {
  width: 1,
  height: 1,
  rooms: [],
  zones: {
    1: { name: 'Z', color: '#fff' },
  },
}

describe('getMapInteractionState', () => {
  it('loading이면 편집/생성을 막는다', () => {
    const state = getMapInteractionState({
      mapData: null,
      loading: true,
      error: null,
    })

    expect(state.status).toBe('loading')
    expect(state.canEdit).toBe(false)
    expect(state.canGenerate).toBe(false)
  })

  it('데이터가 없고 에러가 없으면 empty 상태로 본다', () => {
    const state = getMapInteractionState({
      mapData: null,
      loading: false,
      error: null,
    })

    expect(state.status).toBe('empty')
    expect(state.canEdit).toBe(false)
    expect(state.canGenerate).toBe(true)
  })

  it('에러가 있으면 error 상태로 본다', () => {
    const state = getMapInteractionState({
      mapData: null,
      loading: false,
      error: 'Failed to fetch',
    })

    expect(state.status).toBe('error')
    expect(state.canEdit).toBe(false)
    expect(state.canGenerate).toBe(true)
  })

  it('맵 데이터가 있으면 ready 상태로 본다', () => {
    const state = getMapInteractionState({
      mapData: minimalMapData,
      loading: false,
      error: null,
    })

    expect(state.status).toBe('ready')
    expect(state.canEdit).toBe(true)
    expect(state.canGenerate).toBe(true)
  })
})

describe('getMapInteractionNotice', () => {
  const t = translations.ko

  it('loading 상태는 로딩 메시지를 준다', () => {
    const interaction = getMapInteractionState({
      mapData: null,
      loading: true,
      error: null,
    })

    const notice = getMapInteractionNotice({
      interaction,
      errorMessage: null,
      t,
    })

    expect(notice?.title).toBe(t.generating)
    expect(notice?.description).toBe(t.generatingDescription)
    expect(notice?.action).toBe(null)
    expect(notice?.showImport).toBe(false)
  })

  it('empty 상태는 생성 안내를 준다', () => {
    const interaction = getMapInteractionState({
      mapData: null,
      loading: false,
      error: null,
    })

    const notice = getMapInteractionNotice({
      interaction,
      errorMessage: null,
      t,
    })

    expect(notice?.title).toBe(t.mapEmptyTitle)
    expect(notice?.action).toBe('generate')
    expect(notice?.showImport).toBe(true)
  })

  it('error 상태는 재시도 안내를 준다', () => {
    const interaction = getMapInteractionState({
      mapData: null,
      loading: false,
      error: 'Failed',
    })

    const notice = getMapInteractionNotice({
      interaction,
      errorMessage: 'Failed',
      t,
    })

    expect(notice?.title).toBe(t.error)
    expect(notice?.description).toBe('Failed')
    expect(notice?.action).toBe('retry')
    expect(notice?.showImport).toBe(true)
  })

  it('ready 상태는 안내가 없다', () => {
    const interaction = getMapInteractionState({
      mapData: minimalMapData,
      loading: false,
      error: null,
    })

    const notice = getMapInteractionNotice({
      interaction,
      errorMessage: null,
      t,
    })

    expect(notice).toBe(null)
  })
})
