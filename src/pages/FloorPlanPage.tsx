import { useState, useCallback } from 'react';
import { useAppStore, WallSegment } from '../store/useAppStore';
import ImageUploader from '../components/ImageUploader';
import FloorPlanCanvas from '../components/FloorPlanCanvas';
import { detectWalls, generateFloorPlan } from '../utils/wallDetector';

function FloorPlanPage() {
  const {
    floorPlanImages,
    addFloorPlanImage,
    removeFloorPlanImage,
    detectedWalls,
    setDetectedWalls,
  } = useAppStore();

  const [processing, setProcessing] = useState(false);
  const [showFloorPlan, setShowFloorPlan] = useState(false);
  const [floorPlanData, setFloorPlanData] = useState<{
    walls: WallSegment[];
    width: number;
    height: number;
  } | null>(null);

  const handleImageUpload = useCallback(
    (dataUrl: string) => {
      addFloorPlanImage(dataUrl);
    },
    [addFloorPlanImage]
  );

  const handleDetectWalls = async () => {
    if (floorPlanImages.length === 0) return;

    setProcessing(true);
    try {
      const allWalls: WallSegment[] = [];

      for (const img of floorPlanImages) {
        const walls = await detectWalls(img);
        allWalls.push(...walls);
      }

      setDetectedWalls(allWalls);
      const plan = generateFloorPlan(allWalls);
      setFloorPlanData(plan);
      setShowFloorPlan(true);
    } catch (error) {
      console.error('Wall detection failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleWallUpdate = (updatedWalls: WallSegment[]) => {
    setFloorPlanData((prev) => (prev ? { ...prev, walls: updatedWalls } : null));
  };

  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = '平面図.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportSVG = () => {
    if (!floorPlanData) return;
    const { walls, width, height } = floorPlanData;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
    svg += `<rect width="${width}" height="${height}" fill="white"/>`;
    
    walls.forEach((wall) => {
      svg += `<line x1="${wall.start.x}" y1="${wall.start.y}" x2="${wall.end.x}" y2="${wall.end.y}" stroke="#1f2937" stroke-width="${wall.thickness * 0.3}" stroke-linecap="round"/>`;
    });
    
    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = '平面図.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📐 平面図自動生成
        </h2>
        <p className="text-gray-600">
          複数の室内写真から壁面を検出し、大まかな平面図を生成します
        </p>
      </div>

      {!showFloorPlan ? (
        <div className="space-y-6">
          {/* Upload section */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4">
              ステップ1: 写真を取り込む
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              各部屋の壁が写っている写真を複数枚取り込んでください。
              多方向から撮影するとより正確な平面図が生成されます。
            </p>
            <ImageUploader
              onImageUpload={handleImageUpload}
              multiple={true}
              label="写真を追加"
            />
          </div>

          {/* Uploaded images */}
          {floorPlanImages.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">
                取り込み済み写真（{floorPlanImages.length}枚）
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {floorPlanImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`写真 ${i + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeFloorPlanImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={handleDetectWalls}
                  disabled={processing}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      壁面を検出中...
                    </span>
                  ) : (
                    <span>🔍 壁面を検出して平面図を生成</span>
                  )}
                </button>
                <span className="text-sm text-gray-500">
                  {floorPlanImages.length}枚の写真を解析します
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Floor plan view */}
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {floorPlanData && (
                <FloorPlanCanvas
                  walls={floorPlanData.walls}
                  width={floorPlanData.width}
                  height={floorPlanData.height}
                  editable={true}
                  onWallUpdate={handleWallUpdate}
                />
              )}
            </div>

            <div className="space-y-4">
              {/* Info */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-2">検出結果</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>検出壁面: {detectedWalls.length}本</p>
                  <p>解析写真: {floorPlanImages.length}枚</p>
                </div>
              </div>

              {/* Controls */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">操作</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    • 壁の端点をドラッグして位置調整
                  </p>
                  <p className="text-gray-600">
                    • スクロールでズーム
                  </p>
                  <p className="text-gray-600">
                    • 右クリック+ドラッグで移動
                  </p>
                </div>
              </div>

              {/* Export */}
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">書き出し</h3>
                <div className="space-y-2">
                  <button onClick={handleExportPNG} className="btn-primary w-full text-sm">
                    🖼️ PNG画像で保存
                  </button>
                  <button onClick={handleExportSVG} className="btn-secondary w-full text-sm">
                    📐 SVGで保存
                  </button>
                  <button
                    onClick={() => {
                      const data = JSON.stringify(floorPlanData, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = '平面図データ.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-accent w-full text-sm"
                  >
                    📄 JSONデータ保存
                  </button>
                </div>
              </div>

              {/* Back */}
              <button
                onClick={() => setShowFloorPlan(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                ← 写真選択に戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FloorPlanPage;
