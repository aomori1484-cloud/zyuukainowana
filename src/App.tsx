import { useAppStore } from './store/useAppStore';
import HomePage from './pages/HomePage';
import HandrailPage from './pages/HandrailPage';
import FloorPlanPage from './pages/FloorPlanPage';
import Header from './components/Header';

function App() {
  const mode = useAppStore((s) => s.mode);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {mode === 'home' && <HomePage />}
        {mode === 'handrail' && <HandrailPage />}
        {mode === 'floorplan' && <FloorPlanPage />}
      </main>
    </div>
  );
}

export default App;
