import React from 'react'
import { TileType, TILE_COLORS } from '../../types/map'
import { Translations } from '../../i18n/translations'

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
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12
      }}>
        🖌️ {t.tileBrush}
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
              padding: 6,
              backgroundColor: selectedTile === tile.key ? '#4CAF50' : '#252530',
              border: selectedTile === tile.key ? '2px solid #4CAF50' : '1px solid #444',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              minWidth: 0,
              transition: 'all 0.15s'
            }}
          >
            <div style={{
              width: '100%',
              height: 34,
              backgroundColor: tile.color,
              border: tile.key === 'empty' ? '1px dashed #666' : 'none',
              borderRadius: 4,
              display: 'block'
            }}>
            </div>
            {/* 아이콘은 제거하고, 타일명은 표시(실시간 연동) */}
            <div style={{
              width: '100%',
              fontSize: 10,
              lineHeight: 1.15,
              color: '#ddd',
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




