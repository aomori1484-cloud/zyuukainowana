import { useAppStore } from '../store/useAppStore';

function HomePage() {
  const setMode = useAppStore((s) => s.setMode);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          住宅改修支援アプリ
        </h2>
        <p className="text-gray-600 text-lg">
          写真から手すりの取り付けシミュレーションや、平面図の自動生成を行います
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 手すりシミュレーション */}
        <button
          onClick={() => setMode('handrail')}
          className="card hover:shadow-lg transition-shadow text-left group"
        >
          <div className="text-4xl mb-4">🔧</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
            手すり取り付けシミュレーション
          </h3>
          <p className="text-gray-600 mb-4">
            室内写真を取り込み、手すりを3Dデータで仮想配置。
            取り付け位置や種類を検討できます。
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>✓ 写真に手すりを重ねて表示</li>
            <li>✓ 直線型・L字型・縦型に対応</li>
            <li>✓ サイズ・高さ・色をカスタマイズ</li>
            <li>✓ 3Dプレビューで確認</li>
          </ul>
        </button>

        {/* 平面図生成 */}
        <button
          onClick={() => setMode('floorplan')}
          className="card hover:shadow-lg transition-shadow text-left group"
        >
          <div className="text-4xl mb-4">📐</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
            平面図作成
          </h3>
          <p className="text-gray-600 mb-4">
            テンプレートパーツを配置して
            住宅の平面図を作成します。
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>✓ 部屋・廊下・階段などのパーツ配置</li>
            <li>✓ ドア・窓・設備を自由に配置</li>
            <li>✓ 手すり位置も平面図上に表示</li>
            <li>✓ PNG画像で書き出し</li>
          </ul>
        </button>
      </div>

      <div className="mt-12 text-center text-sm text-gray-400">
        <p>PC・スマートフォン対応 | カメラ撮影 or 画像アップロード</p>
      </div>
    </div>
  );
}

export default HomePage;
