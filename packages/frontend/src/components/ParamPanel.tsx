import React, { useState, useCallback } from 'react'
import { Translations } from '../i18n/translations'

export interface GenerateParams {
  seed: number | null
  zoneCount: number
  zoneSize: 'small' | 'medium' | 'large'
  gateDensity: 'low' | 'medium' | 'high'
}

interface ParamPanelProps {
  onGenerate: (params: GenerateParams) => void
  onGenerateFromPrompt?: (prompt: string) => void
  loading: boolean
  collapsed: boolean
  onToggle: () => void
  t: Translations
}

export function ParamPanel({ onGenerate, onGenerateFromPrompt, loading, collapsed, onToggle, t }: ParamPanelProps) {
  const [seed, setSeed] = useState<string>('')
  const [zoneCount, setZoneCount] = useState(4)
  const [zoneSize, setZoneSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [gateDensity, setGateDensity] = useState<'low' | 'medium' | 'high'>('medium')
  const [aiPrompt, setAiPrompt] = useState<string>('')
  const [generateMode, setGenerateMode] = useState<'params' | 'ai'>('params')

  const handleRandomSeed = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 100000)
    setSeed(newSeed.toString())
  }, [])

  const handleGenerate = useCallback(() => {
    onGenerate({
      seed: seed ? parseInt(seed) : null,
      zoneCount,
      zoneSize,
      gateDensity
    })
  }, [seed, zoneCount, zoneSize, gateDensity, onGenerate])

  const handleGenerateFromPrompt = useCallback(() => {
    if (onGenerateFromPrompt && aiPrompt.trim()) {
      onGenerateFromPrompt(aiPrompt.trim())
    }
  }, [onGenerateFromPrompt, aiPrompt])

  const sizeLabels = {
    small: t.small,
    medium: t.medium,
    large: t.large
  }

  const densityLabels = {
    low: t.low,
    medium: t.medium,
    high: t.high
  }

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          padding: '8px 12px',
          backgroundColor: '#252530',
          border: '1px solid #444',
          borderRadius: 6,
          color: '#fff',
          cursor: 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 100
        }}
      >
        <span>⚙️</span>
        <span>{t.parameters}</span>
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      width: 280,
      backgroundColor: 'rgba(26, 26, 36, 0.95)',
      border: '1px solid #444',
      borderRadius: 8,
      padding: 16,
      zIndex: 100,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid #333'
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
          ⚙️ {t.parameters}
        </span>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4
          }}
        >
          ×
        </button>
      </div>

      {/* Mode Tabs */}
      {onGenerateFromPrompt && (
        <div style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          backgroundColor: '#1a1a20',
          borderRadius: 6,
          padding: 4
        }}>
          <button
            onClick={() => setGenerateMode('params')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: generateMode === 'params' ? '#333' : 'transparent',
              border: 'none',
              borderRadius: 4,
              color: generateMode === 'params' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500
            }}
          >
            📊 파라미터
          </button>
          <button
            onClick={() => setGenerateMode('ai')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: generateMode === 'ai' ? '#7c3aed' : 'transparent',
              border: 'none',
              borderRadius: 4,
              color: generateMode === 'ai' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500
            }}
          >
            🤖 AI 프롬프트
          </button>
        </div>
      )}

      {/* AI Prompt Mode */}
      {generateMode === 'ai' && onGenerateFromPrompt ? (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.aiPrompt}
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={t.aiPromptPlaceholder}
              style={{
                width: '100%',
                minHeight: 100,
                padding: '10px 12px',
                backgroundColor: '#252530',
                border: '1px solid #444',
                borderRadius: 4,
                color: '#fff',
                fontSize: 13,
                marginTop: 6,
                resize: 'vertical',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* AI Generate Button */}
          <button
            onClick={handleGenerateFromPrompt}
            disabled={loading || !aiPrompt.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#333' : !aiPrompt.trim() ? '#444' : '#7c3aed',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: loading || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                {t.aiGenerating}
              </>
            ) : (
              <>
                <span>🤖</span>
                {t.generateFromPrompt}
              </>
            )}
          </button>

          {/* AI Tips */}
          <div style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: '#1a1a20',
            borderRadius: 4,
            fontSize: 11,
            color: '#666',
            lineHeight: 1.6
          }}>
            💡 예시:<br/>
            • "고층 건물이 있는 사이버펑크 도시"<br/>
            • "어두운 미로 같은 던전"<br/>
            • "넓은 숲과 자연 환경"
          </div>
        </>
      ) : (
        <>
          {/* Seed Input */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.seedOptional}
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder={t.random}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#252530',
              border: '1px solid #444',
              borderRadius: 4,
              color: '#fff',
              fontSize: 13
            }}
          />
          <button
            onClick={handleRandomSeed}
            style={{
              padding: '8px 12px',
              backgroundColor: '#333',
              border: '1px solid #444',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13
            }}
            title={t.random}
          >
            🎲
          </button>
        </div>
      </div>

      {/* Zone Count */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.zoneCount}: {zoneCount}
        </label>
        <input
          type="range"
          min={2}
          max={6}
          value={zoneCount}
          onChange={(e) => setZoneCount(parseInt(e.target.value))}
          style={{
            width: '100%',
            marginTop: 6,
            accentColor: '#4CAF50'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#555',
          marginTop: 4
        }}>
          <span>2</span>
          <span>6</span>
        </div>
      </div>

      {/* Zone Size */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.zoneSize}
        </label>
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 6
        }}>
          {(['small', 'medium', 'large'] as const).map(size => (
            <button
              key={size}
              onClick={() => setZoneSize(size)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: zoneSize === size ? '#4CAF50' : '#252530',
                border: `1px solid ${zoneSize === size ? '#4CAF50' : '#444'}`,
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              {sizeLabels[size]}
            </button>
          ))}
        </div>
      </div>

      {/* Gate Density */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
          {t.gateDensity}
        </label>
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 6
        }}>
          {(['low', 'medium', 'high'] as const).map(density => (
            <button
              key={density}
              onClick={() => setGateDensity(density)}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: gateDensity === density ? '#2196F3' : '#252530',
                border: `1px solid ${gateDensity === density ? '#2196F3' : '#444'}`,
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              {densityLabels[density]}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#333' : '#4CAF50',
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          cursor: loading ? 'wait' : 'pointer',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        {loading ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            {t.generating}
          </>
        ) : (
          <>
            <span>🚀</span>
            {t.generateMap}
          </>
        )}
      </button>

          {/* Info */}
          <div style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: '#1a1a20',
            borderRadius: 4,
            fontSize: 11,
            color: '#666',
            lineHeight: 1.5
          }}>
            {t.tipSeed}
          </div>
        </>
      )}
    </div>
  )
}
