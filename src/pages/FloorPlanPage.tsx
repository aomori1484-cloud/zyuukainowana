import { useState, useRef, useEffect } from 'react';

interface FloorPlanItem {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
}

const TEMPLATES = [
  { type: 'room', label: '部屋', width: 120, height: 100, icon: '⬜' },
  { type: 'corridor', label: '廊下', width: 160, height: 40, icon: '▬' },
  { type: 'door', label: 'ドア', width: 40, height: 8, icon: '🚪' },
  { type: 'sliding-door', label: '引き戸', width: 50, height: 8, icon: '⇔' },
  { type: 'stairs', label: '階段', width: 50, height: 80, icon: '🪜' },
  { type: 'toilet', label: 'トイレ', width: 50, height: 60, icon: '🚽' },
  { type: 'bath', label: '浴室', width: 80, height: 80, icon: '🛁' },
  { type: 'kitchen', label: 'キッチン', width: 100, height: 40, icon: '🍳' },
  { type: 'sink', label: '洗面台', width: 40, height: 30, icon: '🪥' },
  { type: 'handrail-h', label: '手すり(横)', width: 60, height: 6, icon: '━' },
  { type: 'handrail-v', label: '手すり(縦)', width: 6, height: 60, icon: '┃' },
  { type: 'wall', label: '壁', width: 120, height: 8, icon: '▮' },
  { type: 'window', label: '窓', width: 60, height: 8, icon: '⊞' },
];

function FloorPlanPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [items, setItems] = useState<FloorPlanItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [canvasSize] = useState({ width: 800, height: 600 });
  const [gridSize] = useState(10);

  // Snap to grid
  const snap = (val: number) => Math.round(val / gridSize) * gridSize;

  // Add item
  const addItem = (type: string) => {
    const template = TEMPLATES.find((t) => t.type === type);
    if (!template) return;
    const newItem: FloorPlanItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      x: canvasSize.width / 2 - template.width / 2,
      y: canvasSize.height / 2 - template.height / 2,
      width: template.width,
      height: template.height,
      rotation: 0,
      label: template.label,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  // Delete selected
  const deleteSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  };

  // Rotate selected
  const rotateSelected = () => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== selectedId) return i;
        // Swap width/height and rotate
        return { ...i, width: i.height, height: i.width, rotation: (i.rotation + 90) % 360 };
      })
    );
  };

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    // Draw items
    items.forEach((item) => {
      const isSelected = item.id === selectedId;

      ctx.save();

      // Item styles based on type
      switch (item.type) {
        case 'room':
          ctx.fillStyle = '#fef3c7';
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 3;
          ctx.fillRect(item.x, item.y, item.width, item.height);
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          break;
        case 'corridor':
          ctx.fillStyle = '#e0e7ff';
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 3;
          ctx.fillRect(item.x, item.y, item.width, item.height);
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          break;
        case 'wall':
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(item.x, item.y, item.width, item.height);
          break;
        case 'door':
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(item.x, item.y + item.height / 2);
          ctx.lineTo(item.x + item.width, item.y + item.height / 2);
          ctx.stroke();
          // Door arc
          ctx.beginPath();
          ctx.arc(item.x, item.y + item.height / 2, item.width, -Math.PI / 2, 0);
          ctx.stroke();
          break;
        case 'sliding-door':
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(item.x, item.y + item.height / 2);
          ctx.lineTo(item.x + item.width, item.y + item.height / 2);
          ctx.stroke();
          ctx.setLineDash([]);
          // Arrow
          ctx.beginPath();
          ctx.moveTo(item.x + item.width * 0.3, item.y + item.height / 2 - 3);
          ctx.lineTo(item.x + item.width * 0.7, item.y + item.height / 2 - 3);
          ctx.moveTo(item.x + item.width * 0.65, item.y + item.height / 2 - 6);
          ctx.lineTo(item.x + item.width * 0.7, item.y + item.height / 2 - 3);
          ctx.lineTo(item.x + item.width * 0.65, item.y + item.height / 2);
          ctx.stroke();
          break;
        case 'stairs':
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          const steps = 8;
          for (let s = 1; s < steps; s++) {
            const sy = item.y + (item.height / steps) * s;
            ctx.beginPath();
            ctx.moveTo(item.x, sy);
            ctx.lineTo(item.x + item.width, sy);
            ctx.stroke();
          }
          break;
        case 'toilet':
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          // Bowl
          ctx.beginPath();
          ctx.ellipse(
            item.x + item.width / 2,
            item.y + item.height * 0.6,
            item.width * 0.3,
            item.height * 0.25,
            0, 0, Math.PI * 2
          );
          ctx.stroke();
          // Tank
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(item.x + item.width * 0.2, item.y + 4, item.width * 0.6, item.height * 0.2);
          ctx.strokeRect(item.x + item.width * 0.2, item.y + 4, item.width * 0.6, item.height * 0.2);
          break;
        case 'bath':
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          // Inner tub
          ctx.fillStyle = '#dbeafe';
          const margin = 8;
          ctx.fillRect(item.x + margin, item.y + margin, item.width - margin * 2, item.height - margin * 2);
          ctx.strokeRect(item.x + margin, item.y + margin, item.width - margin * 2, item.height - margin * 2);
          break;
        case 'kitchen':
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1.5;
          ctx.fillStyle = '#f0fdf4';
          ctx.fillRect(item.x, item.y, item.width, item.height);
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          // Burners
          const cx1 = item.x + item.width * 0.3;
          const cx2 = item.x + item.width * 0.7;
          const cy = item.y + item.height / 2;
          ctx.beginPath();
          ctx.arc(cx1, cy, 8, 0, Math.PI * 2);
          ctx.arc(cx2, cy, 8, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'sink':
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          ctx.beginPath();
          ctx.ellipse(
            item.x + item.width / 2,
            item.y + item.height / 2,
            item.width * 0.3,
            item.height * 0.3,
            0, 0, Math.PI * 2
          );
          ctx.stroke();
          break;
        case 'handrail-h':
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(item.x, item.y + item.height / 2);
          ctx.lineTo(item.x + item.width, item.y + item.height / 2);
          ctx.stroke();
          // End circles
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(item.x, item.y + item.height / 2, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(item.x + item.width, item.y + item.height / 2, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'handrail-v':
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(item.x + item.width / 2, item.y);
          ctx.lineTo(item.x + item.width / 2, item.y + item.height);
          ctx.stroke();
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(item.x + item.width / 2, item.y + item.height, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'window':
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(item.x, item.y + item.height / 2);
          ctx.lineTo(item.x + item.width, item.y + item.height / 2);
          ctx.stroke();
          // Window marks
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          const seg = item.width / 4;
          for (let w = 0; w <= 4; w++) {
            ctx.beginPath();
            ctx.moveTo(item.x + seg * w, item.y);
            ctx.lineTo(item.x + seg * w, item.y + item.height);
            ctx.stroke();
          }
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          break;
        default:
          ctx.fillStyle = '#e5e7eb';
          ctx.fillRect(item.x, item.y, item.width, item.height);
          ctx.strokeStyle = '#6b7280';
          ctx.strokeRect(item.x, item.y, item.width, item.height);
      }

      // Label
      ctx.fillStyle = '#374151';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, item.x + item.width / 2, item.y + item.height + 12);

      // Selection highlight
      if (isSelected) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(item.x - 3, item.y - 3, item.width + 6, item.height + 6);
        ctx.setLineDash([]);

        // Resize handles
        ctx.fillStyle = '#2563eb';
        const handles = [
          [item.x - 4, item.y - 4],
          [item.x + item.width - 4, item.y - 4],
          [item.x - 4, item.y + item.height - 4],
          [item.x + item.width - 4, item.y + item.height - 4],
        ];
        handles.forEach(([hx, hy]) => {
          ctx.fillRect(hx, hy, 8, 8);
        });
      }

      ctx.restore();
    });

    // Scale bar
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('1m (目安)', 10, canvasSize.height - 20);
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, canvasSize.height - 10);
    ctx.lineTo(110, canvasSize.height - 10);
    ctx.stroke();
  }, [items, selectedId, canvasSize, gridSize]);

  // Mouse handlers
  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e);
    // Find clicked item (reverse order = top first)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (pos.x >= item.x && pos.x <= item.x + item.width &&
          pos.y >= item.y && pos.y <= item.y + item.height) {
        setSelectedId(item.id);
        setDragging({ id: item.id, offsetX: pos.x - item.x, offsetY: pos.y - item.y });
        return;
      }
    }
    setSelectedId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const pos = getCanvasPos(e);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== dragging.id) return item;
        return {
          ...item,
          x: snap(pos.x - dragging.offsetX),
          y: snap(pos.y - dragging.offsetY),
        };
      })
    );
  };

  const handleMouseUp = () => setDragging(null);

  // Export
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = '平面図.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📐 平面図作成</h2>
        <p className="text-gray-600">
          テンプレートを配置して平面図を作成します
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-crosshair block"
              style={{ width: canvasSize.width, height: canvasSize.height }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Templates */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h3 className="font-bold text-gray-800 text-sm">パーツ</h3>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addItem(t.type)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 text-xs"
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-gray-600">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected item controls */}
          {selectedId && (
            <div className="card">
              <h3 className="font-bold text-gray-800 text-sm mb-3">選択中のパーツ</h3>
              <div className="space-y-2">
                <button onClick={rotateSelected} className="btn-secondary w-full text-sm">
                  🔄 90°回転
                </button>
                <button onClick={deleteSelected} className="w-full text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                  🗑️ 削除
                </button>
              </div>
              {(() => {
                const item = items.find((i) => i.id === selectedId);
                if (!item) return null;
                return (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">幅</label>
                      <input
                        type="number"
                        value={item.width}
                        onChange={(e) => setItems((prev) => prev.map((i) => i.id === selectedId ? { ...i, width: Number(e.target.value) } : i))}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">高さ</label>
                      <input
                        type="number"
                        value={item.height}
                        onChange={(e) => setItems((prev) => prev.map((i) => i.id === selectedId ? { ...i, height: Number(e.target.value) } : i))}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">ラベル</label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => setItems((prev) => prev.map((i) => i.id === selectedId ? { ...i, label: e.target.value } : i))}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Export */}
          <div className="card">
            <h3 className="font-bold text-gray-800 text-sm mb-3">書き出し</h3>
            <div className="space-y-2">
              <button onClick={handleExportPNG} className="btn-primary w-full text-sm">
                🖼️ PNG画像で保存
              </button>
              <button
                onClick={() => {
                  const data = JSON.stringify(items, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = '平面図データ.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="btn-secondary w-full text-sm"
              >
                📄 JSONで保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FloorPlanPage;
