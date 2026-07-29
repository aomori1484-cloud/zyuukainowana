import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import ImageUploader from '../components/ImageUploader';
import HandrailControls from '../components/HandrailControls';
import Handrail3D from '../components/Handrail3D';

function HandrailPage() {
  const { uploadedImage, setUploadedImage, handrails } = useAppStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🔧 手すり取り付けシミュレーション
        </h2>
        <p className="text-gray-600">
          写真を取り込み、手すりの取り付け位置を3Dでシミュレーションします
        </p>
      </div>

      {!uploadedImage ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-6">📷</div>
          <p className="text-gray-600 mb-6 text-center">
            手すりを取り付けたい場所の写真を撮影または選択してください
          </p>
          <ImageUploader
            onImageUpload={setUploadedImage}
            label="写真を取り込む"
          />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 3D View */}
          <div className="lg:col-span-2">
            <Handrail3D
              handrails={handrails}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              backgroundImage={uploadedImage}
            />

            {/* Image controls */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={uploadedImage}
                  alt="取り込み写真"
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                <span className="text-sm text-gray-500">取り込み済み</span>
              </div>
              <button
                onClick={() => {
                  setUploadedImage(null);
                  setSelectedIndex(null);
                }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                写真を変更
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <HandrailControls
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />

            {/* Export */}
            {handrails.length > 0 && (
              <div className="card">
                <h3 className="font-bold text-gray-800 mb-3">書き出し</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const threeCanvas = document.querySelector('canvas');
                      if (!threeCanvas || !uploadedImage) return;

                      // 合成用キャンバスを作成
                      const exportCanvas = document.createElement('canvas');
                      const w = threeCanvas.clientWidth;
                      const h = threeCanvas.clientHeight;
                      exportCanvas.width = w * 2; // 高解像度
                      exportCanvas.height = h * 2;
                      const ctx = exportCanvas.getContext('2d')!;

                      // 1. 背景写真を描画
                      const bgImg = new Image();
                      bgImg.onload = () => {
                        // 写真をobject-containと同じ比率で描画
                        const imgRatio = bgImg.width / bgImg.height;
                        const canvasRatio = exportCanvas.width / exportCanvas.height;
                        let drawW: number, drawH: number, drawX: number, drawY: number;
                        if (imgRatio > canvasRatio) {
                          drawW = exportCanvas.width;
                          drawH = exportCanvas.width / imgRatio;
                          drawX = 0;
                          drawY = (exportCanvas.height - drawH) / 2;
                        } else {
                          drawH = exportCanvas.height;
                          drawW = exportCanvas.height * imgRatio;
                          drawX = (exportCanvas.width - drawW) / 2;
                          drawY = 0;
                        }
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                        ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

                        // 2. 3Dキャンバスを上に重ねて描画
                        ctx.drawImage(threeCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

                        // 3. JPEG書き出し
                        const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
                        const link = document.createElement('a');
                        link.href = dataUrl;
                        link.download = '手すり改修案.jpg';
                        link.click();
                      };
                      bgImg.src = uploadedImage;
                    }}
                    className="btn-primary w-full text-sm"
                  >
                    🖼️ JPEG画像で保存
                  </button>
                  <button
                    onClick={() => {
                      const data = JSON.stringify({ handrails, image: 'uploaded' }, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = '手すり改修案.json';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn-secondary w-full text-sm"
                  >
                    📄 JSONデータを保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HandrailPage;
