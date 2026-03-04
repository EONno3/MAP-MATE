import React, { useState, useCallback } from 'react'
import { Translations } from '../i18n/translations'
import { Settings, X, Sliders, Bot, Loader2, Lightbulb, Dices, Rocket } from 'lucide-react'

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
        className="panel-base"
        style={{
          position: 'absolute',
          top: 70, // Below toolbar
          left: 16,
          padding: '8px 12px',
          color: 'var(--text-main)',
          cursor: 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          zIndex: 'var(--z-panel)',
          border: '1px solid var(--border-light)'
        }}
      >
        <Settings size={16} color="var(--accent-blue)" />
        <span>{t.parameters}</span>
      </button>
    )
  }

  return (
    <div
      className="panel-base animate-slide-in-left"
      style={{
        position: 'absolute',
        top: 70, // Below toolbar
        left: 16,
        width: 300,
        padding: 20,
        zIndex: 'var(--z-panel)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
          <Settings size={18} color="var(--accent-blue)" />
          {t.parameters}
        </div>
        <button
          onClick={onToggle}
          className="btn-icon"
          style={{ background: 'none', border: 'none', padding: 4 }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Mode Tabs */}
      {onGenerateFromPrompt && (
        <div style={{
          display: 'flex',
          gap: 4,
          marginBottom: 20,
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: 6,
          padding: 4
        }}>
          <button
            onClick={() => setGenerateMode('params')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: generateMode === 'params' ? 'var(--bg-panel-active)' : 'transparent',
              border: generateMode === 'params' ? '1px solid var(--border-light)' : 'none',
              borderRadius: 4,
              color: generateMode === 'params' ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <Sliders size={14} /> 파라미터
          </button>
          <button
            onClick={() => setGenerateMode('ai')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: generateMode === 'ai' ? 'var(--accent-indigo)' : 'transparent',
              border: generateMode === 'ai' ? '1px solid var(--accent-indigo)' : 'none',
              borderRadius: 4,
              color: generateMode === 'ai' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <Bot size={14} /> AI 프롬프트
          </button>
        </div>
      )}

      {/* AI Prompt Mode */}
      {generateMode === 'ai' && onGenerateFromPrompt ? (
        <div className="animate-fade-in">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.aiPrompt}
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={t.aiPromptPlaceholder}
              className="input-base"
              style={{
                width: '100%',
                minHeight: 120,
                marginTop: 8,
                resize: 'vertical',
                lineHeight: 1.5,
                background: 'rgba(0,0,0,0.2)'
              }}
            />
          </div>

          {/* AI Generate Button */}
          <button
            onClick={handleGenerateFromPrompt}
            disabled={loading || !aiPrompt.trim()}
            className="btn-base"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? 'var(--bg-panel)' : (!aiPrompt.trim() ? 'var(--bg-panel-hover)' : 'var(--accent-indigo)'),
              color: loading || !aiPrompt.trim() ? 'var(--text-muted)' : '#fff',
              fontSize: 14
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t.aiGenerating}
              </>
            ) : (
              <>
                <Bot size={16} />
                {t.generateFromPrompt}
              </>
            )}
          </button>

          {/* AI Tips */}
          <div style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--border-radius-md)',
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-blue)', marginBottom: 4 }}>
              <Lightbulb size={14} /> 예시:
            </div>
            • "고층 건물이 있는 사이버펑크 도시"<br />
            • "어두운 미로 같은 던전"<br />
            • "넓은 숲과 자연 환경"
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          {/* Seed Input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.seedOptional}
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder={t.random}
                className="input-base"
                style={{ flex: 1 }}
              />
              <button
                onClick={handleRandomSeed}
                className="btn-base btn-secondary"
                title={t.random}
              >
                <Dices size={16} />
              </button>
            </div>
          </div>

          {/* Zone Count */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.zoneCount}: <span style={{ color: 'var(--text-main)' }}>{zoneCount}</span>
            </label>
            <input
              type="range"
              min={2}
              max={6}
              value={zoneCount}
              onChange={(e) => setZoneCount(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: 8 }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 4
            }}>
              <span>2</span>
              <span>6</span>
            </div>
          </div>

          {/* Zone Size */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.zoneSize}
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setZoneSize(size)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: zoneSize === size ? 'var(--accent-blue)' : 'var(--bg-panel-hover)',
                    border: '1px solid',
                    borderColor: zoneSize === size ? 'var(--accent-blue)' : 'var(--border-light)',
                    borderRadius: 4,
                    color: zoneSize === size ? '#000' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: zoneSize === size ? 600 : 400,
                    transition: 'all 0.2s'
                  }}
                >
                  {sizeLabels[size]}
                </button>
              ))}
            </div>
          </div>

          {/* Gate Density */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {t.gateDensity}
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {(['low', 'medium', 'high'] as const).map(density => (
                <button
                  key={density}
                  onClick={() => setGateDensity(density)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: gateDensity === density ? 'var(--accent-indigo)' : 'var(--bg-panel-hover)',
                    border: '1px solid',
                    borderColor: gateDensity === density ? 'var(--accent-indigo)' : 'var(--border-light)',
                    borderRadius: 4,
                    color: gateDensity === density ? '#fff' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: gateDensity === density ? 600 : 400,
                    transition: 'all 0.2s'
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
            className="btn-base btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: 14 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t.generating}
              </>
            ) : (
              <>
                <Rocket size={16} />
                {t.generateMap}
              </>
            )}
          </button>

          {/* Info */}
          <div style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--border-radius-md)',
            fontSize: 11,
            color: 'var(--text-muted)',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-blue)', marginBottom: 4 }}>
              <Lightbulb size={14} /> Tip:
            </div>
            {t.tipSeed}
          </div>
        </div>
      )}
    </div>
  )
}
