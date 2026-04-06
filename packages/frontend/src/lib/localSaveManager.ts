import { MapData, Connection } from '../types/map'
import { TileCatalogStateV1 } from './tileCatalogState'

export interface LocalSaveSlot {
  id: string
  name: string
  updatedAt: number
  mapData: MapData
  connections: Connection[]
  tileCatalog?: TileCatalogStateV1
}

const STORAGE_KEY = 'mapmate_local_saves'

export function getLocalSaves(): LocalSaveSlot[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  } catch (e) {
    console.error('Failed to parse local saves', e)
    return []
  }
}

export function saveToLocal(
  saveId: string,
  name: string,
  mapData: MapData,
  connections: Connection[],
  tileCatalog?: TileCatalogStateV1
): LocalSaveSlot {
  const saves = getLocalSaves()
  const existingIndex = saves.findIndex(s => s.id === saveId)
  
  const newSave: LocalSaveSlot = {
    id: saveId,
    name,
    updatedAt: Date.now(),
    mapData,
    connections,
    tileCatalog
  }

  if (existingIndex >= 0) {
    saves[existingIndex] = newSave
  } else {
    saves.push(newSave)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
  return newSave
}

export function deleteLocalSave(saveId: string): void {
  const saves = getLocalSaves()
  const filtered = saves.filter(s => s.id !== saveId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function getLocalSave(saveId: string): LocalSaveSlot | null {
  const saves = getLocalSaves()
  return saves.find(s => s.id === saveId) || null
}

export function getLastUpdatedSaveId(): string | null {
  const saves = getLocalSaves()
  if (saves.length === 0) return null
  
  // Sort by updatedAt descending
  saves.sort((a, b) => b.updatedAt - a.updatedAt)
  return saves[0].id
}
