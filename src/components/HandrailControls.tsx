import { useState } from 'react';
import { useAppStore, HandrailConfig } from '../store/useAppStore';

interface HandrailControlsProps {
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
}

function HandrailControls({ selectedIndex, onSelect }: HandrailControlsProps) {
  const { handrails, addHandrail, updateHandrail, removeHandrail } = useAppStore();
  const [editingName, setEditingName] = useState<number | null>(null);

  const handleAddHandrail = (type: HandrailConfig['type']) => {
    const typeLabel = type === 'straight' ? '直線' : type === 'L-shaped' ? 'L字' : '縦';
    // 既存の手すり数に応じてオフセットし、重ならないように配置
    const offset = handrails.length * 50;
    const newHandrail: HandrailConfig = {
      id: `handrail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      length: type === 'vertical' ? 60 : 80,
      height: 75,
      diameter: 32,
      color: '#6B3A1F',
      position: { x: offset, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      name: `${typeLabel}型手すり ${handrails.length + 1}`,
      visible: true,
    };
    addHandrail(newHandrail);
    onSelect(handrails.length);
  };

  const selected = selectedIndex !== null ? handrails[selectedIndex] : null;

  return (
    <div className="space-y-4">
      {/* Add buttons */}
      <div className="card space-y-2">
        <h3 className="font-bold text-gray-800">手すりを追加</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAddHandrail('straight')}
            className="btn-primary text-sm"
          >
            ━ 直線型
          </button>
          <button
            onClick={() => handleAddHandrail('L-shaped')}
            className="btn-secondary text-sm"
          >
            ┗ L字型
          </button>
          <button
            onClick={() => handleAddHandrail('vertical')}
            className="btn-accent text-sm"
          >
            ┃ 縦型
          </button>
        </div>
      </div>

      {/* Layer panel */}
      {handrails.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">レイヤー</h3>
            <span className="text-xs text-gray-400">{handrails.length}件</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
            {handrails.map((h, i) => (
              <div
                key={i}
                onClick={() => onSelect(selectedIndex === i ? null : i)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  selectedIndex === i
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateHandrail(i, { visible: !h.visible });
                  }}
                  className={`text-base flex-shrink-0 ${h.visible ? 'opacity-100' : 'opacity-30'}`}
                  title={h.visible ? '非表示にする' : '表示する'}
                >
                  {h.visible ? '👁️' : '🚫'}
                </button>

                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-300"
                  style={{ backgroundColor: h.color }}
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  {editingName === i ? (
                    <input
                      type="text"
                      value={h.name}
                      onChange={(e) => updateHandrail(i, { name: e.target.value })}
                      onBlur={() => setEditingName(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(null); }}
                      autoFocus
                      className="w-full text-sm border border-blue-300 rounded px-1 py-0.5 outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className={`text-sm truncate block ${h.visible ? 'text-gray-700' : 'text-gray-400 line-through'}`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingName(i);
                      }}
                      title="ダブルクリックで名前を変更"
                    >
                      {h.name}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {h.length}cm / {h.height}cm高
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHandrail(i);
                    if (selectedIndex === i) onSelect(null);
                    else if (selectedIndex !== null && selectedIndex > i) onSelect(selectedIndex - 1);
                  }}
                  className="text-red-300 hover:text-red-600 text-sm flex-shrink-0"
                  title="削除"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected handrail editor */}
      {selected && selectedIndex !== null && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">
              ✏️ {selected.name}
            </p>
            <button
              onClick={() => onSelect(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              選択解除
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">長さ (cm)</label>
              <input
                type="number"
                min="30"
                max="200"
                value={selected.length}
                onChange={(e) =>
                  updateHandrail(selectedIndex, { length: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                type="range"
                min="30"
                max="200"
                value={selected.length}
                onChange={(e) =>
                  updateHandrail(selectedIndex, { length: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">高さ (cm)</label>
              <input
                type="number"
                min="30"
                max="120"
                value={selected.height}
                onChange={(e) =>
                  updateHandrail(selectedIndex, { height: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                type="range"
                min="30"
                max="120"
                value={selected.height}
                onChange={(e) =>
                  updateHandrail(selectedIndex, { height: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">直径 (mm)</label>
              <input
                type="number"
                min="25"
                max="45"
                value={selected.diameter}
                onChange={(e) =>
                  updateHandrail(selectedIndex, { diameter: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <input
                type="range"
                min="25"
                max="45"
                value={selected.diameter}
                onChange={(e) =>
                  updateHandrail(selectedIndex, { diameter: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500">色</label>
              <input
                type="color"
                value={selected.color}
                onChange={(e) =>
                  updateHandrail(selectedIndex, { color: e.target.value })
                }
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Position controls */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">位置調整</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-400">左右</label>
                <input
                  type="number"
                  value={selected.position.x}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      position: { ...selected.position, x: Number(e.target.value) },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                />
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={selected.position.x}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      position: { ...selected.position, x: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">上下</label>
                <input
                  type="number"
                  value={selected.position.y}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      position: { ...selected.position, y: Number(e.target.value) },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                />
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={selected.position.y}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      position: { ...selected.position, y: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">奥行</label>
                <input
                  type="number"
                  value={selected.position.z}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      position: { ...selected.position, z: Number(e.target.value) },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                />
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={selected.position.z}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      position: { ...selected.position, z: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Rotation controls */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">回転（°）</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-400">X軸</label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  step="1"
                  value={selected.rotation.x}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      rotation: { ...selected.rotation, x: Number(e.target.value) },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                />
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selected.rotation.x}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      rotation: { ...selected.rotation, x: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Y軸</label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  step="1"
                  value={selected.rotation.y}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      rotation: { ...selected.rotation, y: Number(e.target.value) },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                />
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selected.rotation.y}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      rotation: { ...selected.rotation, y: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Z軸</label>
                <input
                  type="number"
                  min="0"
                  max="360"
                  step="1"
                  value={selected.rotation.z}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      rotation: { ...selected.rotation, z: Number(e.target.value) },
                    })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-center"
                />
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selected.rotation.z}
                  onChange={(e) =>
                    updateHandrail(selectedIndex, {
                      rotation: { ...selected.rotation, z: Number(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HandrailControls;
