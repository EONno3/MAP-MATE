const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../packages/frontend/src/components/room-editor/RoomEditor.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Remove TagEditor from floating center
code = code.replace(/\{selectedObjectData\s*&&\s*\([\s\S]*?<TagEditor[\s\S]*?\/>\s*\)\}/m, '');

// 2. Extract AI Generation
const aiGenMatch = code.match(/\{?\/\*\s*AI Generation Section[^\n]*\s*\*\/\s*\}?[\s\S]*?<\/div>\n\s*<TilePalette/);
let aiGenCode = '';
if (aiGenMatch) {
  aiGenCode = aiGenMatch[0].replace('<TilePalette', '');
  code = code.replace(aiGenMatch[0], '<TilePalette');
}

// 3. Replace entire right tab content and left floating toolbox
// It's easier to find the `return (` block and reconstruct the main content.
// We will find `<RoomToolbar ... />` and replace everything after it until `{/* Radial Menus */}`
const startMarker = '      />\n\n      {/* Main Content */}';
const endMarker = '      {/* Radial Menus */}';

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const beforeMain = code.substring(0, startIndex + startMarker.length);
const afterMain = code.substring(endIndex);

// We need to construct the new Main Content block manually.
const newMainContent = `
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left Panel (Tools & Palettes) */}
        <div className="panel-base animate-slide-in-left" style={{
          width: 320, flex: '0 0 320px', minWidth: 320,
          borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none',
          display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-panel)',
          zIndex: 10
        }}>
          {/* Tab Switcher (Tiles / Objects) */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-panel-hover)' }}>
            <button key="tab-tiles" onClick={() => { setActiveTab('tiles'); handleSelectTile(selectedTile); }} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === 'tiles' ? 'var(--accent-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'tiles' ? '2px solid var(--accent-blue)' : '2px solid transparent', fontWeight: activeTab === 'tiles' ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
              <Layers size={16} /> 타일 팔레트
            </button>
            <button key="tab-objects" onClick={() => { setActiveTab('objects'); handleSelectObject(selectedObject || 'spawn_point'); }} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === 'objects' ? 'var(--accent-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'objects' ? '2px solid var(--accent-blue)' : '2px solid transparent', fontWeight: activeTab === 'objects' ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
              <Box size={16} /> 오브젝트 팔레트
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* Tools Area */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Wrench size={14} /> 그리기 도구
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button key="tool-brush" onClick={() => { handleSelectTile(selectedTile === 'empty' ? 'solid' : selectedTile); setToolMode('brush') }} className={\`btn-base \${toolMode === 'brush' && !selectedObject && selectedTile !== 'empty' ? 'btn-primary' : 'btn-secondary'}\`} style={{ flex: 1, padding: '8px' }} title="붙이기 (B)"><PenTool size={14} /></button>
              <button key="tool-eraser" onClick={() => { handleSelectTile('empty'); setToolMode('brush') }} className={\`btn-base \${toolMode === 'brush' && !selectedObject && selectedTile === 'empty' ? 'btn-primary' : 'btn-secondary'}\`} style={{ flex: 1, padding: '8px', backgroundColor: toolMode === 'brush' && !selectedObject && selectedTile === 'empty' ? 'var(--accent-red)' : undefined }} title="지우개 (E)"><Eraser size={14} /></button>
              <button key="tool-fill" onClick={() => { handleSelectTile(selectedTile); setToolMode('fill') }} className={\`btn-base \${toolMode === 'fill' && !selectedObject ? 'btn-primary' : 'btn-secondary'}\`} style={{ flex: 1, padding: '8px', backgroundColor: toolMode === 'fill' && !selectedObject ? 'var(--accent-green)' : undefined, color: toolMode === 'fill' && !selectedObject ? '#000' : undefined }} title="채우기 (G)"><Square size={14} /></button>
            </div>

            {!selectedObject && toolMode === 'brush' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>브러시 크기</span>
                  <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, backgroundColor: 'var(--accent-blue)', padding: '2px 6px', borderRadius: 4 }}>{brushSize}×{brushSize}</span>
                </div>
                <input type="range" min="1" max="5" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>
            )}

            <div style={{ height: 1, backgroundColor: 'var(--border-light)', margin: '16px 0' }} />

            {/* Content Based on Left Tab */}
            {activeTab === 'tiles' && (
              <div className="animate-fade-in">
                ${aiGenCode.replace(/\$/g, '$$$$')}
                <TilePalette selectedTile={selectedTile} onSelectTile={handleSelectTile} tileColors={tileColorMap as any} t={t} tiles={tileItems.map((it) => ({ key: it.key, color: it.color, label: it.label }))} />

                {/* Tile Mgmt */}
                <div style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Palette size={14} /> 타일 색상/이름 관리
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tileItems.map((tile) => (
                      <div key={tile.key} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 8, borderBottom: '1px solid #333' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <div style={{ width: 18, height: 18, backgroundColor: tile.color, borderRadius: 4, border: tile.key === 'empty' ? '1px dashed #666' : '1px solid #444', flex: '0 0 auto' }} />
                          <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tile.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="color" value={tile.color as string} onChange={(e) => setTileColor(tile.key, e.target.value)} style={{ width: 34, height: 28, border: 'none', background: 'transparent', cursor: 'pointer' }} title={\`\${tile.key} 색상\`} />
                          <button onClick={() => { const next = prompt('타일명(한국어)', tile.label) ?? ''; setTileName(tile.key, next); }} style={{ padding: '6px 8px', fontSize: 11, background: '#333', border: '1px solid #444', color: '#ddd', borderRadius: 6, cursor: 'pointer' }}>이름</button>
                          <button onClick={() => { if (tile.isBuiltin) return; const ok = confirm(\`타일을 삭제할까요?\\n\\n- \${tile.label}\\n- key: \${tile.key}\`); if (ok) deleteTile(tile.key); }} disabled={tile.isBuiltin} style={{ padding: '6px 8px', fontSize: 11, background: tile.isBuiltin ? '#2a2a34' : '#3a1f1f', border: '1px solid #444', color: tile.isBuiltin ? '#666' : '#ffb4b4', borderRadius: 6, cursor: tile.isBuiltin ? 'not-allowed' : 'pointer' }}>삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #333' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 8, fontWeight: 600 }}>➕ 새 타일 추가</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input value={newTileName} onChange={(e) => setNewTileName(e.target.value)} placeholder="타일명" style={{ flex: 1, padding: '6px 8px', background: '#1a1a24', border: '1px solid #444', borderRadius: 6, color: '#fff', fontSize: 11 }} />
                      <input type="color" value={newTileColor} onChange={(e) => setNewTileColor(e.target.value)} style={{ width: 34, height: 34, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                    </div>
                    <button onClick={() => { addTile({ color: newTileColor, name: newTileName || undefined }); setNewTileName(''); }} style={{ width: '100%', padding: '8px', backgroundColor: '#3b82f6', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>새 타일 추가</button>
                  </div>
                  <button onClick={resetTileCatalog} className="btn-base btn-secondary" style={{ width: '100%', marginTop: 10, padding: '8px' }}>초기화</button>
                </div>
              </div>
            )}

            {activeTab === 'objects' && (
              <div className="animate-fade-in">
                <ObjectPalette selectedObject={selectedObject} onSelectObject={handleSelectObject} t={t} />
              </div>
            )}
            
            {/* Hint Footer */}
            <div style={{ marginTop: 24, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--border-radius-sm)', fontSize: 11, color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: 6, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: 4 }}><Lightbulb size={14} /> 단축키 팁</div>
              <div>• B: 붙이기 / E: 지우기 / G: 채우기</div>
              <div>• Spacebar + 드래그: 지도 이동</div>
              <div>• 1/2키 길게: 퀵 방사형 메뉴</div>
            </div>
          </div>
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
          {mapData && <RoomNavigator mapData={mapData} currentRoom={room} />}
          <RoomCanvas
            roomDetail={roomDetail}
            activeLayerId={activeLayerId}
            selectedTile={selectedTile}
            selectedObject={selectedObject}
            brushSize={brushSize}
            toolMode={toolMode}
            onUpdateActiveLayerTiles={handleUpdateActiveLayerTiles}
            onUpdateActiveLayerObjects={handleUpdateActiveLayerObjects}
            selectedObjectInstance={selectedObjectInstance}
            onSelectObjectInstance={setSelectedObjectInstance}
            tileColors={tileColorMap as any}
            t={t}
          />
        </div>

        {/* Right Panel (Layers, Props, Global Actions) */}
        <div className="panel-base" style={{
          width: 340, flex: '0 0 340px', minWidth: 340,
          borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none',
          padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-panel)'
        }}>
          {/* Top Global Actions */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button key="btn-undo" onClick={undo} disabled={!canUndo} title={\`\${t.undo} (Ctrl+Z)\`} className="btn-base" style={{ flex: 1, padding: '8px', backgroundColor: canUndo ? 'var(--bg-panel-hover)' : 'transparent', color: canUndo ? 'var(--text-main)' : 'var(--text-muted)' }}>
                <Undo2 size={16} /> {t.undo}
              </button>
              <button key="btn-redo" onClick={redo} disabled={!canRedo} title={\`\${t.redo} (Ctrl+Y)\`} className="btn-base" style={{ flex: 1, padding: '8px', backgroundColor: canRedo ? 'var(--bg-panel-hover)' : 'transparent', color: canRedo ? 'var(--text-main)' : 'var(--text-muted)' }}>
                <Redo2 size={16} /> {t.redo}
              </button>
            </div>

            <button key="btn-playtest" onClick={() => setIsPlayingTest(true)} className="btn-base" style={{ width: '100%', padding: '8px', backgroundColor: 'var(--accent-green)', color: '#000', fontWeight: 'bold' }}>
              <Play size={16} fill="#000" /> 플레이 테스트
            </button>

            {hasChanges && (
              <div style={{ padding: 8, backgroundColor: 'rgba(248, 113, 113, 0.1)', borderRadius: 'var(--border-radius-sm)', fontSize: 11, color: 'var(--accent-red)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> {t.unsavedChangesIndicator}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* Properties / Tag Editor */}
            {selectedObjectData && (
              <div className="animate-fade-in" style={{ marginBottom: 16 }}>
                <TagEditor
                  object={selectedObjectData}
                  onUpdate={handleUpdateObjectProperties}
                  onClose={() => setSelectedObjectInstance(null)}
                />
              </div>
            )}

            {/* Layers Area */}
            <div style={{ fontSize: 12, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border-light)' }}>
              <Layers size={14} /> 레이어 관리
            </div>
            
            <div className="animate-fade-in">
              <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <button key="btn-layer-tile" onClick={() => {
                  const id = \`layer_\${Date.now()}\`
                  const newLayers = [...roomDetail.layers, { id, name: \`타일 레이어 \${roomDetail.layers.length}\`, type: 'tile' as const, visible: true, opacity: 1, tiles: generateDefaultRoomDetail(room).layers[0].tiles }]
                  setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                  setActiveLayerId(id)
                  setHasChanges(true)
                }} className="btn-base btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 12 }}>
                  <Plus size={14} /> 타일
                </button>
                <button key="btn-layer-object" onClick={() => {
                  const id = \`layer_\${Date.now()}\`
                  const newLayers = [...roomDetail.layers, { id, name: \`오브젝트 레이어 \${roomDetail.layers.length}\`, type: 'object' as const, visible: true, opacity: 1, objects: [] }]
                  setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                  setActiveLayerId(id)
                  setHasChanges(true)
                }} className="btn-base btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 12 }}>
                  <Plus size={14} /> 오브젝트
                </button>
                <button key="btn-layer-image" onClick={() => {
                  const id = \`layer_\${Date.now()}\`
                  const newLayers = [...roomDetail.layers, { id, name: \`이미지 레이어 \${roomDetail.layers.length}\`, type: 'image' as const, visible: true, opacity: 0.5, imageUrl: '' }]
                  setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                  setActiveLayerId(id)
                  setHasChanges(true)
                }} className="btn-base btn-secondary" style={{ flex: 1, padding: '8px', fontSize: 12 }}>
                  <Plus size={14} /> 이미지
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {roomDetail.layers.slice().reverse().map((layer) => (
                  <div key={layer.id} onClick={() => setActiveLayerId(layer.id)} style={{ padding: 12, backgroundColor: activeLayerId === layer.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)', border: activeLayerId === layer.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: layer.type === 'tile' ? 'var(--accent-green)' : 'var(--accent-indigo)' }} title={layer.type} />
                    <div style={{ flex: 1, fontSize: 13, color: '#fff' }}>{layer.name}</div>
                    <button onClick={(e) => {
                      e.stopPropagation()
                      const newLayers = roomDetail.layers.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)
                      setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                      setHasChanges(true)
                    }} className="btn-base" style={{ padding: 4, background: 'transparent' }}>
                      <span style={{ opacity: layer.visible ? 1 : 0.4 }}>👁️</span>
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation()
                      if (roomDetail.layers.length <= 1) return alert('최소 1개의 레이어가 필요합니다.')
                      if (confirm(\`'\${layer.name}' 레이어를 삭제할까요?\`)) {
                        const newLayers = roomDetail.layers.filter(l => l.id !== layer.id)
                        setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                        if (activeLayerId === layer.id) setActiveLayerId(newLayers[newLayers.length - 1].id)
                        setHasChanges(true)
                      }
                    }} className="btn-base" style={{ padding: 4, color: 'var(--accent-red)', background: 'transparent' }}>
                      <span style={{ fontSize: 12 }}>❌</span>
                    </button>
                  </div>
                ))}
              </div>

              {(() => {
                const activeLayer = roomDetail.layers.find(l => l.id === activeLayerId)
                if (!activeLayer) return null
                return (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>{activeLayer.name} 속성</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>불투명도</span>
                      <input type="range" min="0" max="1" step="0.1" value={activeLayer.opacity} onChange={(e) => {
                        const newLayers = roomDetail.layers.map(l => l.id === activeLayer.id ? { ...l, opacity: parseFloat(e.target.value) } : l)
                        setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                        setHasChanges(true)
                      }} style={{ flex: 1 }} />
                      <span style={{ fontSize: 11 }}>{Math.round(activeLayer.opacity * 100)}%</span>
                    </div>
                    {activeLayer.type === 'image' && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>이미지 URL (또는 Data URI)</div>
                        <input type="text" className="input-base" style={{ width: '100%', fontSize: 11, padding: '6px 8px' }} value={activeLayer.imageUrl || ''} onChange={(e) => {
                          const newLayers = roomDetail.layers.map(l => l.id === activeLayer.id ? { ...l, imageUrl: e.target.value } : l)
                          setRoomDetailHistory({ ...roomDetail, layers: newLayers })
                          setHasChanges(true)
                        }} placeholder="https://..." />
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
\n`;

fs.writeFileSync(targetFile, beforeMain + newMainContent + afterMain, 'utf8');
console.log('RoomEditor refactor successful');
