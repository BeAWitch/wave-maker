import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, RotateCcw } from 'lucide-react';

import { useContainerSize } from '../hooks/useContainerSize';
import { useStore } from '../store/useStore';

const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;

function getDefaultTimelinePixelsPerMs(width: number, duration: number) {
  if (width <= 0 || duration <= 0) {
    return 1;
  }

  return width / duration;
}

interface GroupDragState {
  active: boolean;
  anchorId: string | null;
  initialTimes: Record<string, number>;
  startClientX: number;
}

interface ScrubState {
  active: boolean;
}

const formatTime = (ms: number) => {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
};

const parseTime = (str: string): number | null => {
  const parts = str.split(':');
  if (parts.length === 1) {
    const seconds = parseFloat(parts[0]);
    if (Number.isNaN(seconds)) return null;
    return Math.round(seconds * 1000);
  }
  if (parts.length !== 2) return null;
  const minutes = parseInt(parts[0], 10);
  const seconds = parseFloat(parts[1]);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return Math.round((minutes * 60 + seconds) * 1000);
};

export function Timeline() {
  const {
    currentTime,
    duration,
    keyframes,
    selectedKeyframeIds,
    timelinePixelsPerMs,
    setCurrentTime,
    setDuration,
    setSelectedKeyframeIds,
    setTimelinePixelsPerMs,
    updateKeyframes,
  } = useStore();
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineSize = useContainerSize(timelineRef);
  const groupDragStateRef = useRef<GroupDragState>({ active: false, anchorId: null, initialTimes: {}, startClientX: 0 });
  const scrubStateRef = useRef<ScrubState>({ active: false });
  const selectionAnchorRef = useRef<string | null>(null);
  const hasInitializedZoomRef = useRef(false);
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [currentInputStr, setCurrentInputStr] = useState('');
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [durationInputStr, setDurationInputStr] = useState('');

  useEffect(() => {
    if (hasInitializedZoomRef.current || timelineSize.width <= 0 || duration <= 0) {
      return;
    }

    setTimelinePixelsPerMs(getDefaultTimelinePixelsPerMs(timelineSize.width, duration));
    hasInitializedZoomRef.current = true;
  }, [duration, setTimelinePixelsPerMs, timelineSize.width]);

  const visibleWidthMs = useMemo(() => {
    if (timelineSize.width <= 0) {
      return duration;
    }

    return timelineSize.width / timelinePixelsPerMs;
  }, [duration, timelinePixelsPerMs, timelineSize.width]);

  const visibleStartTime = useMemo(() => {
    if (timelineSize.width <= 0) {
      return 0;
    }

    if (visibleWidthMs >= duration) {
      return 0;
    }

    const centeredStart = currentTime - visibleWidthMs / 2;
    return Math.max(0, Math.min(centeredStart, duration - visibleWidthMs));
  }, [currentTime, duration, timelineSize.width, visibleWidthMs]);

  const timeToX = useCallback((time: number) => {
    return (time - visibleStartTime) * timelinePixelsPerMs;
  }, [timelinePixelsPerMs, visibleStartTime]);

  const visibleEndTime = Math.min(duration, visibleStartTime + visibleWidthMs);
  const rightBoundaryX = useMemo(() => {
    if (timelineSize.width <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(timeToX(visibleEndTime), timelineSize.width) - 1);
  }, [timeToX, timelineSize.width, visibleEndTime]);

  const updateTimeFromClientX = useCallback((clientX: number) => {
    if (!timelineRef.current) {
      return;
    }

    const rect = timelineRef.current.getBoundingClientRect();
    const localX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const nextTime = Math.max(0, Math.min(visibleStartTime + localX / timelinePixelsPerMs, duration));
    setCurrentTime(nextTime);
  }, [duration, setCurrentTime, timelinePixelsPerMs, visibleStartTime]);

  const getRangeSelection = useCallback((anchorId: string, targetId: string) => {
    const anchorIndex = keyframes.findIndex((keyframe) => keyframe.id === anchorId);
    const targetIndex = keyframes.findIndex((keyframe) => keyframe.id === targetId);

    if (anchorIndex === -1 || targetIndex === -1) {
      return [targetId];
    }

    const startIndex = Math.min(anchorIndex, targetIndex);
    const endIndex = Math.max(anchorIndex, targetIndex);

    return keyframes.slice(startIndex, endIndex + 1).map((keyframe) => keyframe.id);
  }, [keyframes]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR;
    setTimelinePixelsPerMs(timelinePixelsPerMs * zoomFactor);
  };

  const handleTimelinePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    setSelectedKeyframeIds([]);
    selectionAnchorRef.current = null;
    scrubStateRef.current.active = true;
    updateTimeFromClientX(event.clientX);
  };

  const handleWindowPointerMove = useCallback((event: PointerEvent) => {
    if (groupDragStateRef.current.active) {
      const deltaX = event.clientX - groupDragStateRef.current.startClientX;
      const deltaTime = deltaX / timelinePixelsPerMs;
      const updatesById = Object.fromEntries(
        Object.entries(groupDragStateRef.current.initialTimes).map(([id, initialTime]) => [
          id,
          { time: Math.max(0, Math.min(initialTime + deltaTime, duration)) },
        ])
      );
      updateKeyframes(updatesById);
      return;
    }

    if (!scrubStateRef.current.active) {
      return;
    }

    updateTimeFromClientX(event.clientX);
  }, [duration, timelinePixelsPerMs, updateKeyframes, updateTimeFromClientX]);

  const handleWindowPointerUp = useCallback(() => {
    if (groupDragStateRef.current.active) {
      groupDragStateRef.current = { active: false, anchorId: null, initialTimes: {}, startClientX: 0 };
    }

    scrubStateRef.current.active = false;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [handleWindowPointerMove, handleWindowPointerUp]);

  const startEditingCurrent = () => {
    setCurrentInputStr(formatTime(currentTime));
    setIsEditingCurrent(true);
  };

  const submitCurrent = () => {
    const value = parseTime(currentInputStr);
    if (value !== null) {
      setCurrentTime(Math.max(0, Math.min(value, duration)));
    }
    setIsEditingCurrent(false);
  };

  const startEditingDuration = () => {
    setDurationInputStr(formatTime(duration));
    setIsEditingDuration(true);
  };

  const submitDuration = () => {
    const value = parseTime(durationInputStr);
    if (value !== null && value > 0) {
      setDuration(value);
      if (currentTime > value) {
        setCurrentTime(value);
      }
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
            <button
              type="button"
              className="ml-2 flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-950/80 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
              onClick={() => setTimelinePixelsPerMs(getDefaultTimelinePixelsPerMs(timelineSize.width, duration))}
            >
              <RotateCcw size={12} />
              Reset Zoom
            </button>
          </div>
          <div className="text-sm font-mono tracking-wider bg-zinc-950 px-3 py-1 rounded border border-zinc-800 text-blue-400 flex items-center gap-2">
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
              <span className="cursor-text hover:text-blue-300" onClick={startEditingCurrent}>
                {formatTime(currentTime)}
              </span>
            )}
            <span className="text-zinc-600">/</span>
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
              <span className="cursor-text hover:text-blue-300" onClick={startEditingDuration}>
                {formatTime(duration)}
              </span>
            )}
          </div>
        </div>

        <div
          className="relative flex-1 group mt-2 touch-none"
          ref={timelineRef}
          onWheel={handleWheel}
          onPointerDown={handleTimelinePointerDown}
        >
          <div
            className="absolute inset-y-0 z-10 pointer-events-none"
            style={{ left: `${rightBoundaryX}px` }}
          >
            <div className="absolute -top-5 right-0 rounded border border-blue-500/40 bg-zinc-950/95 px-2 py-0.5 text-[10px] font-mono tracking-wide text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              {formatTime(visibleEndTime)}
            </div>
            <div className="absolute top-1/2 bottom-0 w-px h-10 -translate-y-1/2 bg-blue-400/70 shadow-[0_0_8px_rgba(59,130,246,0.45)]"></div>
          </div>

          <div className="absolute top-1/2 left-0 right-0 h-3 bg-zinc-900 shadow-inner rounded-full -translate-y-1/2 border border-zinc-800 pointer-events-none"></div>

          <div
            className="absolute top-1/2 h-3 bg-blue-600/20 -translate-y-1/2 pointer-events-none rounded-l-full"
            style={{ width: `${timeToX(currentTime)}px` }}
          />

          <div
            className="absolute top-1/2 bottom-0 w-px bg-red-500 z-20 pointer-events-none -translate-y-1/2 h-10"
            style={{ left: `${timeToX(currentTime)}px` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 drop-shadow-md"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-red-500/50"></div>
          </div>

          {keyframes
            .filter((keyframe) => keyframe.time >= visibleStartTime && keyframe.time <= visibleEndTime)
            .map((keyframe) => {
              const x = timeToX(keyframe.time);
              const isSelected = selectedKeyframeIds.includes(keyframe.id);

              return (
                <div
                  key={`timeline-marker-${keyframe.id}`}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-[1.5px] border-zinc-900 z-10 cursor-grab transition-transform hover:scale-125"
                  style={{
                    left: `${x}px`,
                    backgroundColor: isSelected ? '#f59e0b' : '#3b82f6',
                    boxShadow: isSelected
                      ? '0 0 10px rgba(245, 158, 11, 0.9)'
                      : '0 0 8px rgba(59, 130, 246, 0.8)',
                  }}
                  title={`Keyframe at ${keyframe.time}ms`}
                  onPointerDown={(event) => {
                    event.stopPropagation();

                    const isCtrlLike = event.ctrlKey || event.metaKey;
                    const isShift = event.shiftKey;
                    const anchorId = selectionAnchorRef.current ?? selectedKeyframeIds[selectedKeyframeIds.length - 1] ?? keyframe.id;
                    let nextSelection: string[];

                    if (isShift) {
                      const rangeSelection = getRangeSelection(anchorId, keyframe.id);
                      nextSelection = isCtrlLike
                        ? [...new Set([...selectedKeyframeIds, ...rangeSelection])]
                        : rangeSelection;
                    } else if (isCtrlLike) {
                      nextSelection = selectedKeyframeIds.includes(keyframe.id)
                        ? selectedKeyframeIds.filter((id) => id !== keyframe.id)
                        : [...selectedKeyframeIds, keyframe.id];
                    } else {
                      nextSelection = [keyframe.id];
                    }

                    setSelectedKeyframeIds(nextSelection);

                    if (!nextSelection.includes(keyframe.id)) {
                      selectionAnchorRef.current = nextSelection[nextSelection.length - 1] ?? null;
                      return;
                    }

                    selectionAnchorRef.current = keyframe.id;
                    groupDragStateRef.current = {
                      active: true,
                      anchorId: keyframe.id,
                      startClientX: event.clientX,
                      initialTimes: Object.fromEntries(
                        nextSelection
                          .map((id) => keyframes.find((item) => item.id === id))
                          .filter((item): item is NonNullable<typeof item> => Boolean(item))
                          .map((item) => [item.id, item.time])
                      ),
                    };
                  }}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}
