import React from 'react'
import { ObjectType } from '../../types/map'
import { Translations } from '../../i18n/translations'
import { Box, User, Star, Package, ToggleLeft, Ghost, Save, ArrowRightCircle } from 'lucide-react'

interface ObjectPaletteProps {
  selectedObject: ObjectType | null
  onSelectObject: (obj: ObjectType | null) => void
  t: Translations
}

const OBJECTS: ObjectType[] = [
  'spawn_point', 'enemy_spawn', 'item', 'chest',
  'switch', 'npc', 'save_point', 'transition'
]

// Local mapping for Lucide icons
const ObjectIcon = ({ type, color }: { type: ObjectType, color?: string }) => {
  const size = 20
  switch (type) {
    case 'spawn_point': return <Box size={size} color={color || '#22c55e'} />
    case 'enemy_spawn': return <Ghost size={size} color={color || '#ef4444'} />
    case 'item': return <Star size={size} color={color || '#eab308'} />
    case 'chest': return <Package size={size} color={color || '#a855f7'} />
    case 'switch': return <ToggleLeft size={size} color={color || '#06b6d4'} />
    case 'npc': return <User size={size} color={color || '#f97316'} />
    case 'save_point': return <Save size={size} color={color || '#3b82f6'} />
    case 'transition': return <ArrowRightCircle size={size} color={color || '#ec4899'} />
    default: return <Box size={size} color={color} />
  }
}

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
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12
      }}>
        <Package size={14} color="var(--accent-blue)" /> {t.objects}
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
              backgroundColor: selectedObject === obj ? 'var(--bg-panel-active)' : 'var(--bg-panel-hover)',
              border: '1px solid',
              borderColor: selectedObject === obj ? 'var(--accent-blue)' : 'var(--border-light)',
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ObjectIcon type={obj} />
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: selectedObject === obj ? 600 : 400,
              color: selectedObject === obj ? '#fff' : 'var(--text-muted)',
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
          className="btn-base btn-secondary"
          style={{ width: '100%', marginTop: 8 }}
        >
          {t.cancelSelection}
        </button>
      )}
    </div>
  )
}
