import { Toolbar } from './components/Toolbar';
import { CanvasArea } from './components/CanvasArea';
import { Timeline } from './components/Timeline';
import { useAnimationLoop } from './hooks/useAnimationLoop';
import './App.css';

function App() {
  useAnimationLoop();
  
  return (
    <div className="flex flex-col h-screen w-full bg-black font-sans overflow-hidden text-gray-100 selection:bg-blue-600/30">
      <Toolbar />
      <CanvasArea />
      <Timeline />
    </div>
  );
}

export default App;
