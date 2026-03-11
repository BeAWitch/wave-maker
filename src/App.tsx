import { Header } from './components/Header';
import { ControlsBar } from './components/ControlsBar';
import { CanvasArea } from './components/CanvasArea';
import { Timeline } from './components/Timeline';
import { useAnimationLoop } from './hooks/useAnimationLoop';

function App() {
  useAnimationLoop();
  
  return (
    <div className="flex flex-col w-full h-full bg-zinc-950 font-sans overflow-hidden text-zinc-100 selection:bg-blue-500/30">
      <Header />
      <ControlsBar />
      <div className="flex-1 w-full relative flex flex-col min-h-0">
        <CanvasArea />
      </div>
      <div className="w-full flex flex-col shrink-0">
        <Timeline />
      </div>
    </div>
  );
}

export default App;
