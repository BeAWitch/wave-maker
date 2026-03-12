import { useMemo, useRef, useState } from 'react';
import { Circle, Layer, Line, Stage } from 'react-konva';
import type Konva from 'konva';
import { RotateCcw } from 'lucide-react';

import { useContainerSize } from '../hooks/useContainerSize';
import { useStore } from '../store/useStore';
import { getCurvePoints, getInterpolatedValue, getScreenKeyframes } from '../utils/animation';

const STAGE_HEIGHT = 600;
const MAX_VALUE = 200;
const SAMPLE_STEP_MS = 16;
const POINT_RADIUS = 8;
const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;
const DEFAULT_PIXELS_PER_MS = 1;
const SNAP_THRESHOLD_PX = 10;
const TIMELINE_BLUE = '#3b82f6';

interface SnapGuidesState {
  horizontal: boolean;
  vertical: boolean;
  leftBoundary: boolean;
  rightBoundary: boolean;
}

export function CanvasArea() {
  const {
    currentTime,
    duration,
    keyframes,
    pixelsPerMs,
    selectedKeyframeId,
    setCurrentTime,
    setPixelsPerMs,
    setSelectedKeyframeId,
    updateKeyframe,
  } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<{ startClientX: number; startTime: number; active: boolean }>({
    startClientX: 0,
    startTime: 0,
    active: false,
  });
  const [snapGuides, setSnapGuides] = useState<SnapGuidesState>({
    horizontal: false,
    vertical: false,
    leftBoundary: false,
    rightBoundary: false,
  });
  const size = useContainerSize(containerRef);

  const centerX = size.width / 2;
  const centerY = STAGE_HEIGHT / 2;
  const topBoundY = centerY - MAX_VALUE;
  const bottomBoundY = centerY + MAX_VALUE;
  const minBoundX = centerX - currentTime * pixelsPerMs;
  const maxBoundX = centerX + (duration - currentTime) * pixelsPerMs;

  const screenKeyframes = useMemo(
    () => getScreenKeyframes(keyframes, currentTime, centerX, centerY, pixelsPerMs),
    [centerX, centerY, currentTime, keyframes, pixelsPerMs]
  );

  const curvePoints = useMemo(
    () => getCurvePoints(keyframes, currentTime, size.width, centerX, centerY, pixelsPerMs, SAMPLE_STEP_MS),
    [centerX, centerY, currentTime, keyframes, pixelsPerMs, size.width]
  );

  const currentValue = getInterpolatedValue(keyframes, currentTime) ?? 0;
  const markerY = centerY - currentValue;

  const getSnappedPosition = (position: { x: number; y: number }) => {
    const clampedX = Math.max(minBoundX, Math.min(position.x, maxBoundX));
    const clampedY = Math.max(topBoundY, Math.min(position.y, bottomBoundY));
    const vertical = Math.abs(clampedX - centerX) <= SNAP_THRESHOLD_PX;
    const horizontal = Math.abs(clampedY - centerY) <= SNAP_THRESHOLD_PX;
    const leftBoundary = Math.abs(position.x - minBoundX) <= SNAP_THRESHOLD_PX || position.x < minBoundX;
    const rightBoundary = Math.abs(position.x - maxBoundX) <= SNAP_THRESHOLD_PX || position.x > maxBoundX;

    let snappedX = clampedX;

    if (leftBoundary) {
      snappedX = minBoundX;
    } else if (rightBoundary) {
      snappedX = maxBoundX;
    } else if (vertical) {
      snappedX = centerX;
    }

    return {
      x: snappedX,
      y: horizontal ? centerY : clampedY,
      vertical,
      horizontal,
      leftBoundary,
      rightBoundary,
    };
  };

  const handleKeyframeDrag = (id: string, event: Konva.KonvaEventObject<DragEvent>) => {
    const nextScreenX = event.target.x();
    const nextScreenY = event.target.y();
    const nextTime = currentTime + (nextScreenX - centerX) / pixelsPerMs;
    const nextValue = centerY - nextScreenY;

    updateKeyframe(id, {
      time: Math.max(0, Math.min(nextTime, duration)),
      value: Math.max(-MAX_VALUE, Math.min(nextValue, MAX_VALUE)),
    });
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();

    const zoomFactor = event.evt.deltaY < 0 ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR;
    setPixelsPerMs(pixelsPerMs * zoomFactor);
  };

  const handleStagePointerDown = (event: Konva.KonvaEventObject<PointerEvent>) => {
    if (event.target !== event.target.getStage()) {
      return;
    }

    setSelectedKeyframeId(null);
    panStateRef.current = {
      startClientX: event.evt.clientX,
      startTime: currentTime,
      active: true,
    };
    document.body.style.cursor = 'grabbing';
  };

  const handleStagePointerMove = (event: Konva.KonvaEventObject<PointerEvent>) => {
    if (!panStateRef.current.active) {
      return;
    }

    const deltaX = event.evt.clientX - panStateRef.current.startClientX;
    const nextTime = panStateRef.current.startTime - deltaX / pixelsPerMs;
    setCurrentTime(nextTime);
  };

  const handleStagePointerUp = () => {
    if (!panStateRef.current.active) {
      return;
    }

    panStateRef.current.active = false;
    document.body.style.cursor = 'default';
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-[#18181b] relative overflow-hidden px-6 py-6">
      <div
        ref={containerRef}
        className="w-full relative overflow-hidden flex-shrink-0 rounded-xl border border-zinc-800 bg-[#18181b] shadow-[0_0_16px_rgba(255,255,255,0.08)]"
        style={{
          height: `${STAGE_HEIGHT}px`,
          backgroundImage: 'radial-gradient(circle, #3f3f46 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          touchAction: 'none',
        }}
      >
        <div className="absolute top-4 left-6 z-10 pointer-events-none font-mono text-xs uppercase tracking-wider text-zinc-500">
          Workspace: {size.width} x {STAGE_HEIGHT} | Zoom: {pixelsPerMs.toFixed(2)} px/ms
        </div>
        <button
          type="button"
          className="absolute top-3 right-4 z-10 flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-900"
          onClick={() => setPixelsPerMs(DEFAULT_PIXELS_PER_MS)}
        >
          <RotateCcw size={14} />
          Reset Zoom
        </button>

        {size.width > 0 && (
          <Stage
            width={size.width}
            height={STAGE_HEIGHT}
            onWheel={handleWheel}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerLeave={handleStagePointerUp}
            onPointerCancel={handleStagePointerUp}
          >
            <Layer>
              <Line
                points={[0, centerY, size.width, centerY]}
                stroke={snapGuides.horizontal ? 'rgba(251,191,36,0.95)' : 'rgba(255,255,255,0.12)'}
                strokeWidth={snapGuides.horizontal ? 2 : 1}
                dash={snapGuides.horizontal ? [10, 6] : [8, 8]}
                shadowColor={snapGuides.horizontal ? 'rgba(251,191,36,0.6)' : 'transparent'}
                shadowBlur={snapGuides.horizontal ? 12 : 0}
                listening={false}
              />
              <Line points={[0, topBoundY, size.width, topBoundY]} stroke="rgba(255,255,255,0.62)" strokeWidth={2} />
              <Line points={[0, bottomBoundY, size.width, bottomBoundY]} stroke="rgba(255,255,255,0.62)" strokeWidth={2} />
              <Line
                points={[centerX, 0, centerX, STAGE_HEIGHT]}
                stroke={snapGuides.vertical ? 'rgba(251,191,36,0.9)' : 'rgba(255,255,255,0.12)'}
                strokeWidth={snapGuides.vertical ? 2 : 1}
                dash={snapGuides.vertical ? [10, 6] : [8, 8]}
                shadowColor={snapGuides.vertical ? 'rgba(251,191,36,0.55)' : 'transparent'}
                shadowBlur={snapGuides.vertical ? 10 : 0}
                listening={false}
              />
              <Line
                points={[minBoundX, 0, minBoundX, STAGE_HEIGHT]}
                stroke={snapGuides.leftBoundary ? TIMELINE_BLUE : 'rgba(255,255,255,0.28)'}
                strokeWidth={snapGuides.leftBoundary ? 2 : 1}
                dash={snapGuides.leftBoundary ? [10, 6] : [6, 10]}
                shadowColor={snapGuides.leftBoundary ? 'rgba(59,130,246,0.55)' : 'transparent'}
                shadowBlur={snapGuides.leftBoundary ? 10 : 0}
                listening={false}
              />
              <Line
                points={[maxBoundX, 0, maxBoundX, STAGE_HEIGHT]}
                stroke={snapGuides.rightBoundary ? TIMELINE_BLUE : 'rgba(255,255,255,0.28)'}
                strokeWidth={snapGuides.rightBoundary ? 2 : 1}
                dash={snapGuides.rightBoundary ? [10, 6] : [6, 10]}
                shadowColor={snapGuides.rightBoundary ? 'rgba(59,130,246,0.55)' : 'transparent'}
                shadowBlur={snapGuides.rightBoundary ? 10 : 0}
                listening={false}
              />

              {curvePoints.length > 3 && (
                <Line
                  points={curvePoints}
                  stroke="#f4f4f5"
                  strokeWidth={6}
                  lineJoin="round"
                  lineCap="round"
                  tension={0.45}
                />
              )}

              <Circle
                x={centerX}
                y={markerY}
                radius={16}
                fill="rgba(255,255,255,0.28)"
                listening={false}
              />

              {screenKeyframes.map((keyframe) => (
                <Circle
                  key={keyframe.id}
                  x={keyframe.screenX}
                  y={keyframe.screenY}
                  radius={POINT_RADIUS}
                  fill={selectedKeyframeId === keyframe.id ? '#fef3c7' : '#e5e7eb'}
                  stroke={selectedKeyframeId === keyframe.id ? '#f59e0b' : '#fb923c'}
                  strokeWidth={selectedKeyframeId === keyframe.id ? 3 : 2}
                  draggable
                  dragBoundFunc={(position) => getSnappedPosition(position)}
                  onPointerDown={() => {
                    setSelectedKeyframeId(keyframe.id);
                  }}
                  onDragMove={(event) => {
                    const snappedPosition = getSnappedPosition({ x: event.target.x(), y: event.target.y() });
                    setSnapGuides({
                      horizontal: snappedPosition.horizontal,
                      vertical: snappedPosition.vertical,
                      leftBoundary: snappedPosition.leftBoundary,
                      rightBoundary: snappedPosition.rightBoundary,
                    });
                    handleKeyframeDrag(keyframe.id, event);
                  }}
                  onDragEnd={(event) => {
                    handleKeyframeDrag(keyframe.id, event);
                    setSnapGuides({ horizontal: false, vertical: false, leftBoundary: false, rightBoundary: false });
                  }}
                  onDragStart={() => {
                    panStateRef.current.active = false;
                    setSelectedKeyframeId(keyframe.id);
                    setSnapGuides({ horizontal: false, vertical: false, leftBoundary: false, rightBoundary: false });
                  }}
                  onMouseEnter={() => {
                    document.body.style.cursor = 'grab';
                  }}
                  onMouseLeave={() => {
                    if (!panStateRef.current.active) {
                      document.body.style.cursor = 'default';
                    }
                  }}
                  shadowColor="rgba(251,146,60,0.45)"
                  shadowBlur={10}
                />
              ))}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}
