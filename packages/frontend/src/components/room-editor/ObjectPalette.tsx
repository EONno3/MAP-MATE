import React from 'react'
import { ObjectType, OBJECT_ICONS } from '../../types/map'
import { Translations } from '../../i18n/translations'

interface ObjectPaletteProps {
  selectedObject: ObjectType | null
  onSelectObject: (obj: ObjectType | null) => void
  t: Translations
}

const OBJECTS: ObjectType[] = [
  'spawn_point', 'enemy_spawn', 'item', 'chest', 
  'switch', 'npc', 'save_point', 'transition'
]

export function ObjectPalette({ selectedObject, onSelectObject, t }: ObjectPaletteProps) {
  const getObjectName = (obj: ObjectType): string => {
    const names: Record<ObjectType, keyof Translations> = {
      spawn_point: 'objectSpawnPoint',
      enemy_spawn: 'objectEnemySpawn',
      item: 'objectItem',
      chest: 'objectChest',
      switch: 'objectSwitch',
      npc: 'objectNpc',
      save_point: 'objectSavePoint',
      transition: 'objectTransition'
    }
    return t[names[obj]] as string
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12
      }}>
        📦 {t.objects}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8
      }}>
        {OBJECTS.map(obj => (
          <button
            key={obj}
            onClick={() => onSelectObject(selectedObject === obj ? null : obj)}
            title={getObjectName(obj)}
            style={{
              padding: '10px 8px',
              backgroundColor: selectedObject === obj ? '#2196F3' : '#252530',
              border: selectedObject === obj ? '2px solid #2196F3' : '1px solid #444',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s'
            }}
          >
            <div style={{
              fontSize: 20,
              lineHeight: 1
            }}>
              {OBJECT_ICONS[obj]}
            </div>
            <span style={{
              fontSize: 9,
              color: selectedObject === obj ? '#fff' : '#aaa',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}>
              {getObjectName(obj)}
            </span>
          </button>
        ))}
      </div>
      
      {selectedObject && (
        <button
          onClick={() => onSelectObject(null)}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '8px',
            backgroundColor: 'transparent',
            border: '1px solid #444',
            borderRadius: 4,
            color: '#888',
            cursor: 'pointer',
            fontSize: 11
          }}
        >
          {t.cancelSelection}
        </button>
      )}
    </div>
  )
}




