import React from 'react'
import { TileType, TILE_ICONS, TILE_COLORS } from '../../types/map'
import { Translations } from '../../i18n/translations'

interface TilePaletteProps {
  selectedTile: TileType
  onSelectTile: (tile: TileType) => void
  t: Translations
}

const TILES: TileType[] = ['empty', 'solid', 'platform', 'spike', 'acid', 'breakable', 'door']

export function TilePalette({ selectedTile, onSelectTile, t }: TilePaletteProps) {
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
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 8
      }}>
        {TILES.map(tile => (
          <button
            key={tile}
            onClick={() => onSelectTile(tile)}
            title={getTileName(tile)}
            style={{
              padding: '10px 8px',
              backgroundColor: selectedTile === tile ? '#4CAF50' : '#252530',
              border: selectedTile === tile ? '2px solid #4CAF50' : '1px solid #444',
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
              width: 24,
              height: 24,
              backgroundColor: TILE_COLORS[tile],
              border: tile === 'empty' ? '1px dashed #666' : 'none',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14
            }}>
              {tile !== 'empty' && tile !== 'solid' && TILE_ICONS[tile]}
            </div>
            <span style={{
              fontSize: 10,
              color: selectedTile === tile ? '#fff' : '#aaa',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%'
            }}>
              {getTileName(tile)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}




