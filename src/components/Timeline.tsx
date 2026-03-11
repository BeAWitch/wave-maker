import { useStore } from '../store/useStore';

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
    <div className="h-48 bg-gray-900 border-t border-gray-700 flex flex-col p-4 text-gray-300">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-mono tracking-wider text-blue-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div className="relative flex-1 group cursor-pointer" onClick={(e) => {
        // Simple click to seek logic
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        setCurrentTime(ratio * duration);
      }}>
        {/* Track Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 rounded-full -translate-y-1/2"></div>
        
        {/* Progress Fill */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-500 rounded-l-full -translate-y-1/2 transition-all duration-100 ease-linear"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        ></div>

        {/* Playhead Marker */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-sm"></div>
        </div>

        {/* Keyframe Markers */}
        {keyframes.map((kf) => (
          <div
            key={`timeline-marker-${kf.id}`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border border-white z-10 cursor-pointer transition-colors hover:bg-white"
            style={{ 
              left: `${(kf.time / duration) * 100}%`,
              backgroundColor: '#3b82f6' // Blue match
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
  );
}
