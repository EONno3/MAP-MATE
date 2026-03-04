import React, { useState } from 'react'
import { RoomObject, UNITY_COMPONENT_MAP } from '../../types/map'
import { X, Plus } from 'lucide-react'

interface TagEditorProps {
    object: RoomObject
    onUpdate: (updated: RoomObject) => void
    onClose: () => void
}

export function TagEditor({ object, onUpdate, onClose }: TagEditorProps) {
    const [newTag, setNewTag] = useState('')
    const availableTags = Object.keys(UNITY_COMPONENT_MAP)

    const handleAddTag = () => {
        if (!newTag || (object.tags && object.tags.includes(newTag))) return
        onUpdate({
            ...object,
            tags: [...(object.tags || []), newTag]
        })
        setNewTag('')
    }

    const handleRemoveTag = (tag: string) => {
        onUpdate({
            ...object,
            tags: (object.tags || []).filter(t => t !== tag),
            tagData: (() => {
                const next = { ...object.tagData }
                delete next[tag]
                return next
            })()
        })
    }

    const updateTagData = (tag: string, key: string, value: any) => {
        onUpdate({
            ...object,
            tagData: {
                ...(object.tagData || {}),
                [tag]: {
                    ...(object.tagData?.[tag] || {}),
                    [key]: value
                }
            }
        })
    }

    return (
        <div className="panel-base animate-fade-in" style={{
            display: 'flex', flexDirection: 'column', gap: 12, padding: 16,
            border: 'none', borderBottom: '1px solid var(--border-light)', borderRadius: 0
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>선택 오브젝트 ({object.type})</div>
                <button onClick={onClose} className="btn-base" style={{ padding: 4, background: 'transparent' }}><X size={16} /></button>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {object.id}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>위치: ({object.x}, {object.y})</div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Unity 태그</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {(object.tags || []).map(tag => (
                        <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--accent-blue)', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
                            {tag}
                            <button onClick={() => handleRemoveTag(tag)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}><X size={10} /></button>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                    <select value={newTag} onChange={e => setNewTag(e.target.value)} className="input-base" style={{ flex: 1, padding: '4px 8px', fontSize: 11 }}>
                        <option value="">태그 선택...</option>
                        {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={handleAddTag} className="btn-base btn-primary" style={{ padding: '4px 8px' }}><Plus size={14} /></button>
                </div>
            </div>

            {(object.tags && object.tags.length > 0) && (
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>태그 파라미터</div>
                    {object.tags.map(tag => {
                        const defs = UNITY_COMPONENT_MAP[tag]?.components || []
                        const props = defs.flatMap(c => Object.entries(c.properties || {}).map(([key, val]) => ({ component: c.type, key, defaultValue: val })))
                        if (props.length === 0) return null

                        return (
                            <div key={tag} style={{ padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                                <div style={{ fontSize: 11, fontWeight: 'bold', color: 'var(--accent-blue)', marginBottom: 6 }}>{tag}</div>
                                {props.map(p => {
                                    const val = object.tagData?.[tag]?.[p.key] ?? p.defaultValue
                                    const isBool = typeof val === 'boolean'
                                    const isNumber = typeof p.defaultValue === 'number'

                                    return (
                                        <div key={p.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.key}</span>
                                            {isBool ? (
                                                <input type="checkbox" checked={val} onChange={e => updateTagData(tag, p.key, e.target.checked)} />
                                            ) : isNumber ? (
                                                <input type="number" value={val} onChange={e => updateTagData(tag, p.key, parseFloat(e.target.value))} className="input-base" style={{ width: 60, padding: '2px 4px', fontSize: 11 }} />
                                            ) : (
                                                <input type="text" value={val} onChange={e => updateTagData(tag, p.key, e.target.value)} className="input-base" style={{ width: 60, padding: '2px 4px', fontSize: 11 }} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
