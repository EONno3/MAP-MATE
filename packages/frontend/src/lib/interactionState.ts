import { MapData } from '../types/map'
import { Translations } from '../i18n/translations'

export type MapInteractionStatus = 'loading' | 'ready' | 'error' | 'empty'

export interface MapInteractionInput {
  mapData: MapData | null
  loading: boolean
  error: string | null
}

export interface MapInteractionState {
  status: MapInteractionStatus
  canEdit: boolean
  canGenerate: boolean
}

export interface MapInteractionNotice {
  title: string
  description: string
  actionLabel: string | null
  action: 'generate' | 'retry' | null
  showImport: boolean
}

export function getMapInteractionState({
  mapData,
  loading,
  error,
}: MapInteractionInput): MapInteractionState {
  if (loading) {
    return {
      status: 'loading',
      canEdit: false,
      canGenerate: false,
    }
  }

  if (!mapData) {
    return {
      status: error ? 'error' : 'empty',
      canEdit: false,
      canGenerate: true,
    }
  }

  return {
    status: 'ready',
    canEdit: true,
    canGenerate: true,
  }
}

export function getMapInteractionNotice({
  interaction,
  errorMessage,
  t,
}: {
  interaction: MapInteractionState
  errorMessage: string | null
  t: Translations
}): MapInteractionNotice | null {
  if (interaction.status === 'loading') {
    return {
      title: t.generating,
      description: t.generatingDescription,
      actionLabel: null,
      action: null,
      showImport: false,
    }
  }

  if (interaction.status === 'empty') {
    return {
      title: t.mapEmptyTitle,
      description: t.mapEmptyDescription,
      actionLabel: t.generateMap,
      action: 'generate',
      showImport: true,
    }
  }

  if (interaction.status === 'error') {
    return {
      title: t.error,
      description: errorMessage || t.mapErrorDescription,
      actionLabel: t.retry,
      action: 'retry',
      showImport: true,
    }
  }

  return null
}
