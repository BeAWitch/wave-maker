import { useStore } from '../store/useStore';
import { Clock } from 'lucide-react';

export function Timeline() {
  const { currentTime, duration, keyframes, setCurrentTime } = useStore();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
  };

  return (
    <div className="h-40 bg-[#18181b] border-t border-zinc-800 flex flex-col items-center p-6 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] z-10 shrink-0 w-full">
      <div className="w-full max-w-5xl flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock size={16} />
            <span className="text-xs font-semibold tracking-widest uppercase">Timeline</span>
          </div>
          <div className="text-sm font-mono tracking-wider bg-zinc-950 px-3 py-1 rounded border border-zinc-800 text-blue-400">
            {formatTime(currentTime)} <span className="text-zinc-600">/</span> {formatTime(duration)}
          </div>
        </div>

        <div className="relative flex-1 group cursor-pointer mt-2" onClick={(e) => {
          // Simple click to seek logic
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setCurrentTime(ratio * duration);
        }}>
          {/* Track Line - The Groove */}
          <div className="absolute top-1/2 left-0 right-0 h-3 bg-zinc-900 shadow-inner rounded-full -translate-y-1/2 border border-zinc-800"></div>
          
          {/* Progress Fill */}
          <div 
            className="absolute top-1/2 left-0 h-3 bg-blue-600/20 rounded-l-full -translate-y-1/2 transition-all duration-100 ease-linear"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          ></div>

          {/* Playhead Marker */}
          <div 
            className="absolute top-1/2 bottom-0 w-px bg-red-500 z-20 pointer-events-none -translate-y-1/2 h-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 drop-shadow-md"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-red-500/50"></div>
          </div>

          {/* Keyframe Markers */}
          {keyframes.map((kf) => (
            <div
              key={`timeline-marker-${kf.id}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-[1.5px] border-zinc-900 z-10 cursor-pointer transition-transform hover:scale-125"
              style={{ 
                left: `${(kf.time / duration) * 100}%`,
                backgroundColor: '#3b82f6',
                boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)'
              }}
              title={`Keyframe at ${kf.time}ms`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentTime(kf.time);
              }}
            />
          ))}

          {/* Input slider (Invisible overlay for native dragging support) */}
          <input 
            type="range" 
            min={0} 
            max={duration} 
            value={currentTime} 
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            step="1"
          />
        </div>
      </div>
    </div>
  );
}
