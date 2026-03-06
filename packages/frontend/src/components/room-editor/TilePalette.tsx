import React from 'react'
import { TileType, TILE_COLORS } from '../../types/map'
import { Translations } from '../../i18n/translations'
import { PenTool } from 'lucide-react'

interface TilePaletteProps {
  selectedTile: TileType
  onSelectTile: (tile: TileType) => void
  tileColors?: Partial<Record<TileType, string>>
  t: Translations
  tiles?: Array<{ key: string; label: string; color: string }>
}

const TILES: TileType[] = ['empty', 'solid', 'platform', 'spike', 'acid', 'breakable', 'door']

export function TilePalette({ selectedTile, onSelectTile, tileColors, t, tiles }: TilePaletteProps) {
  const getTileName = (tile: TileType): string => {
    const names: Record<TileType, keyof Translations> = {
      empty: 'tileEmpty',
      solid: 'tileSolid',
      platform: 'tilePlatform',
      spike: 'tileSpike',
      acid: 'tileAcid',
      breakable: 'tileBreakable',
      door: 'tileDoor'
    }
    return t[names[tile]] as string
  }

  const displayTiles = tiles ?? TILES.map((k) => ({ key: k, label: getTileName(k), color: (tileColors?.[k] ?? TILE_COLORS[k]) as string }))

  return (
    <div data-tutorial="roomeditor-tiles" style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12
      }}>
        <PenTool size={14} color="var(--accent-blue)" /> {t.tileBrush}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8
      }}>
        {displayTiles.map((tile) => (
          <button
            key={tile.key}
            onClick={() => onSelectTile(tile.key as TileType)}
            title={tile.label}
            style={{
              padding: '6px 4px',
              backgroundColor: selectedTile === tile.key ? 'var(--bg-panel-active)' : 'var(--bg-panel-hover)',
              border: '1px solid',
              borderColor: selectedTile === tile.key ? 'var(--accent-blue)' : 'var(--border-light)',
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
              transition: 'all 0.15s'
            }}
          >
            <div style={{
              width: '100%',
              height: 28,
              backgroundColor: tile.color,
              border: tile.key === 'empty' ? '1px dashed var(--border-light)' : 'none',
              borderRadius: 4,
              display: 'block',
              boxShadow: 'var(--shadow-sm)'
            }}>
            </div>
            {/* 아이콘은 제거하고, 타일명은 표시(실시간 연동) */}
            <div style={{
              width: '100%',
              fontSize: 10,
              fontWeight: selectedTile === tile.key ? 600 : 400,
              lineHeight: 1.15,
              color: selectedTile === tile.key ? '#fff' : 'var(--text-muted)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'keep-all'
            }}>
              {tile.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
