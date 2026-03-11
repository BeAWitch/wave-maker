import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Clock } from 'lucide-react';

// Format helper MM:SS.ms (e.g. 00:02.59)
const formatTime = (ms: number) => {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
};

// Parse helper to ms
const parseTime = (str: string): number | null => {
  const parts = str.split(':');
  if (parts.length === 1) {
    const s = parseFloat(parts[0]);
    if (isNaN(s)) return null;
    return Math.round(s * 1000);
  }
  if (parts.length !== 2) return null;
  const m = parseInt(parts[0], 10);
  const s = parseFloat(parts[1]);
  if (isNaN(m) || isNaN(s)) return null;
  return Math.round((m * 60 + s) * 1000);
};

export function Timeline() {
  const { currentTime, duration, keyframes, setCurrentTime, setDuration } = useStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Local state for editable time
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [currentInputStr, setCurrentInputStr] = useState('');
  
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [durationInputStr, setDurationInputStr] = useState('');

  // Handle pointer drag using window events for better reliability
  const isDragging = useRef(false);

  const updateTimeFromPointer = useCallback((clientX: number) => {
    if (!timelineRef.current) {
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    let ratio = (clientX - rect.left) / rect.width;
    if (ratio < 0) ratio = 0;
    if (ratio > 1) ratio = 1;
    setCurrentTime(ratio * duration);
  }, [duration, setCurrentTime]);

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (isDragging.current) {
        updateTimeFromPointer(e.clientX);
      }
    };
    const handleWindowPointerUp = (e: PointerEvent) => {
      if (isDragging.current) {
        isDragging.current = false;
        updateTimeFromPointer(e.clientX);
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [updateTimeFromPointer]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    updateTimeFromPointer(e.clientX);
  };

  // Editing current time
  const startEditingCurrent = () => {
    setCurrentInputStr(formatTime(currentTime));
    setIsEditingCurrent(true);
  };
  const submitCurrent = () => {
    const val = parseTime(currentInputStr);
    if (val !== null) {
      setCurrentTime(Math.max(0, Math.min(val, duration)));
    }
    setIsEditingCurrent(false);
  };
  
  // Editing duration
  const startEditingDuration = () => {
    setDurationInputStr(formatTime(duration));
    setIsEditingDuration(true);
  };
  const submitDuration = () => {
    const val = parseTime(durationInputStr);
    if (val !== null && val > 0) { // Duration must be > 0
      setDuration(val);
      if (currentTime > val) setCurrentTime(val); // clamp
    }
    setIsEditingDuration(false);
  };

  return (
    <div className="h-40 bg-[#18181b] border-t border-zinc-800 flex flex-col items-center p-6 shadow-[0_-4px_10px_rgba(0,0,0,0.3)] z-10 shrink-0 w-full select-none">
      <div className="w-full max-w-5xl flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock size={16} />
            <span className="text-xs font-semibold tracking-widest uppercase">Timeline</span>
          </div>
          <div className="text-sm font-mono tracking-wider bg-zinc-950 px-3 py-1 rounded border border-zinc-800 text-blue-400 flex items-center gap-2">
            
            {/* Current Time Display/Edit */}
            {isEditingCurrent ? (
              <input 
                autoFocus
                className="bg-transparent text-blue-400 outline-none w-20 text-center"
                value={currentInputStr}
                onChange={(e) => setCurrentInputStr(e.target.value)}
                onBlur={submitCurrent}
                onKeyDown={(e) => e.key === 'Enter' && submitCurrent()}
              />
            ) : (
              <span 
                className="cursor-text hover:text-blue-300"
                onClick={startEditingCurrent}
              >
                {formatTime(currentTime)}
              </span>
            )}
            
            <span className="text-zinc-600">/</span> 
            
            {/* Duration Time Display/Edit */}
            {isEditingDuration ? (
              <input 
                autoFocus
                className="bg-transparent text-blue-400 outline-none w-20 text-center"
                value={durationInputStr}
                onChange={(e) => setDurationInputStr(e.target.value)}
                onBlur={submitDuration}
                onKeyDown={(e) => e.key === 'Enter' && submitDuration()}
              />
            ) : (
              <span 
                className="cursor-text hover:text-blue-300"
                onClick={startEditingDuration}
              >
                {formatTime(duration)}
              </span>
            )}

          </div>
        </div>

        <div 
          className="relative flex-1 group cursor-pointer mt-2 touch-none" 
          ref={timelineRef}
          onPointerDown={handlePointerDown}
        >
          {/* Track Line - The Groove */}
          <div className="absolute top-1/2 left-0 right-0 h-3 bg-zinc-900 shadow-inner rounded-full -translate-y-1/2 border border-zinc-800 pointer-events-none"></div>
          
          {/* Progress Fill */}
          <div 
            className="absolute top-1/2 left-0 h-3 bg-blue-600/20 rounded-l-full -translate-y-1/2 transition-none pointer-events-none"
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
              onPointerDown={(e) => {
                e.stopPropagation();
                setCurrentTime(kf.time);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
