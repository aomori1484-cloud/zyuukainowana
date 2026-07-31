import { useAppStore } from '../store/useAppStore';

function Header() {
  const { mode, setMode } = useAppStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMode('home')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">🏠</span>
          <h1 className="text-xl font-bold text-gray-800">住改のWANA</h1>
        </button>

        <nav className="flex gap-2">
          <button
            onClick={() => setMode('handrail')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'handrail'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🔧 手すりシミュレーション
          </button>
          <button
            onClick={() => setMode('floorplan')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'floorplan'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📐 平面図作成
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
