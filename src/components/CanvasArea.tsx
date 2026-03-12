import { useMemo, useRef, useState } from 'react';
import { Circle, Layer, Line, Rect, Stage } from 'react-konva';
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
const SNAP_THRESHOLD_PX = 6;
const TIMELINE_BLUE = '#3b82f6';
const CENTER_GUIDE_YELLOW = 'rgba(251,191,36,0.95)';

interface SnapGuidesState {
  horizontal: boolean;
  vertical: boolean;
  leftBoundary: boolean;
  rightBoundary: boolean;
  topBoundary: boolean;
  bottomBoundary: boolean;
}

interface MarqueeState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface GroupDragState {
  active: boolean;
  anchorId: string | null;
  initialById: Record<string, { screenX: number; screenY: number; time: number; value: number }>;
}

export function CanvasArea() {
  const {
    currentTime,
    duration,
    keyframes,
    pixelsPerMs,
    selectedKeyframeIds,
    setCurrentTime,
    setPixelsPerMs,
    setSelectedKeyframeIds,
    updateKeyframes,
  } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<{ startClientX: number; startTime: number; active: boolean }>({
    startClientX: 0,
    startTime: 0,
    active: false,
  });
  const initialMarqueeState: MarqueeState = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
  const marqueeStateRef = useRef<MarqueeState>(initialMarqueeState);
  const groupDragStateRef = useRef<GroupDragState>({ active: false, anchorId: null, initialById: {} });
  const [marqueeState, setMarqueeState] = useState<MarqueeState>(initialMarqueeState);
  const [snapGuides, setSnapGuides] = useState<SnapGuidesState>({
    horizontal: false,
    vertical: false,
    leftBoundary: false,
    rightBoundary: false,
    topBoundary: false,
    bottomBoundary: false,
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

  const screenKeyframesById = useMemo(
    () => Object.fromEntries(screenKeyframes.map((keyframe) => [keyframe.id, keyframe])),
    [screenKeyframes]
  );

  const curvePoints = useMemo(
    () => getCurvePoints(keyframes, currentTime, size.width, centerX, centerY, pixelsPerMs, SAMPLE_STEP_MS),
    [centerX, centerY, currentTime, keyframes, pixelsPerMs, size.width]
  );

  const currentValue = getInterpolatedValue(keyframes, currentTime) ?? 0;
  const markerY = centerY - currentValue;

  const resetSnapGuides = () => {
    setSnapGuides({
      horizontal: false,
      vertical: false,
      leftBoundary: false,
      rightBoundary: false,
      topBoundary: false,
      bottomBoundary: false,
    });
  };

  const setMarquee = (nextState: MarqueeState) => {
    marqueeStateRef.current = nextState;
    setMarqueeState(nextState);
  };

  const getSnappedPosition = (position: { x: number; y: number }) => {
    const clampedX = Math.max(minBoundX, Math.min(position.x, maxBoundX));
    const clampedY = Math.max(topBoundY, Math.min(position.y, bottomBoundY));
    const vertical = Math.abs(clampedX - centerX) <= SNAP_THRESHOLD_PX;
    const horizontal = Math.abs(clampedY - centerY) <= SNAP_THRESHOLD_PX;
    const leftBoundary = Math.abs(position.x - minBoundX) <= SNAP_THRESHOLD_PX || position.x < minBoundX;
    const rightBoundary = Math.abs(position.x - maxBoundX) <= SNAP_THRESHOLD_PX || position.x > maxBoundX;
    const topBoundary = Math.abs(position.y - topBoundY) <= SNAP_THRESHOLD_PX || position.y < topBoundY;
    const bottomBoundary = Math.abs(position.y - bottomBoundY) <= SNAP_THRESHOLD_PX || position.y > bottomBoundY;

    let snappedX = clampedX;
    let snappedY = clampedY;

    if (leftBoundary) {
      snappedX = minBoundX;
    } else if (rightBoundary) {
      snappedX = maxBoundX;
    } else if (vertical) {
      snappedX = centerX;
    }

    if (topBoundary) {
      snappedY = topBoundY;
    } else if (bottomBoundary) {
      snappedY = bottomBoundY;
    } else if (horizontal) {
      snappedY = centerY;
    }

    return {
      x: snappedX,
      y: snappedY,
      vertical,
      horizontal,
      leftBoundary,
      rightBoundary,
      topBoundary,
      bottomBoundary,
    };
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

    const stage = event.target.getStage();
    const pointerPosition = stage?.getPointerPosition();

    if (!pointerPosition) {
      return;
    }

    if (event.evt.button === 1) {
      panStateRef.current = {
        startClientX: event.evt.clientX,
        startTime: currentTime,
        active: true,
      };
      document.body.style.cursor = 'grabbing';
      return;
    }

    if (event.evt.button !== 0) {
      return;
    }

    setSelectedKeyframeIds([]);
    setMarquee({
      active: true,
      startX: pointerPosition.x,
      startY: pointerPosition.y,
      currentX: pointerPosition.x,
      currentY: pointerPosition.y,
    });
  };

  const handleStagePointerMove = (event: Konva.KonvaEventObject<PointerEvent>) => {
    if (panStateRef.current.active) {
      const deltaX = event.evt.clientX - panStateRef.current.startClientX;
      const nextTime = panStateRef.current.startTime - deltaX / pixelsPerMs;
      setCurrentTime(nextTime);
      return;
    }

    if (!marqueeStateRef.current.active) {
      return;
    }

    const stage = event.target.getStage();
    const pointerPosition = stage?.getPointerPosition();

    if (!pointerPosition) {
      return;
    }

    setMarquee({
      ...marqueeStateRef.current,
      currentX: pointerPosition.x,
      currentY: pointerPosition.y,
    });
  };

  const finalizeMarqueeSelection = () => {
    const { startX, startY, currentX, currentY } = marqueeStateRef.current;
    const left = Math.min(startX, currentX);
    const right = Math.max(startX, currentX);
    const top = Math.min(startY, currentY);
    const bottom = Math.max(startY, currentY);

    const selectedIds = screenKeyframes
      .filter((keyframe) => keyframe.screenX >= left && keyframe.screenX <= right && keyframe.screenY >= top && keyframe.screenY <= bottom)
      .map((keyframe) => keyframe.id);

    setSelectedKeyframeIds(selectedIds);
    setMarquee({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  };

  const handleStagePointerUp = () => {
    if (panStateRef.current.active) {
      panStateRef.current.active = false;
      document.body.style.cursor = 'default';
    }

    if (marqueeStateRef.current.active) {
      finalizeMarqueeSelection();
    }
  };

  const handleKeyframeDragStart = (keyframeId: string) => {
    panStateRef.current.active = false;
    resetSnapGuides();

    const selection = selectedKeyframeIds.includes(keyframeId) ? selectedKeyframeIds : [keyframeId];
    setSelectedKeyframeIds(selection);

    const initialById = Object.fromEntries(
      selection
        .map((id) => {
          const keyframe = screenKeyframesById[id];

          if (!keyframe) {
            return null;
          }

          return [id, { screenX: keyframe.screenX, screenY: keyframe.screenY, time: keyframe.time, value: keyframe.value }] as const;
        })
        .filter((entry): entry is readonly [string, { screenX: number; screenY: number; time: number; value: number }] => entry !== null)
    );

    groupDragStateRef.current = {
      active: true,
      anchorId: keyframeId,
      initialById,
    };
  };

  const handleKeyframeDragMove = (id: string, event: Konva.KonvaEventObject<DragEvent>) => {
    const snappedPosition = getSnappedPosition({ x: event.target.x(), y: event.target.y() });
    setSnapGuides({
      horizontal: snappedPosition.horizontal,
      vertical: snappedPosition.vertical,
      leftBoundary: snappedPosition.leftBoundary,
      rightBoundary: snappedPosition.rightBoundary,
      topBoundary: snappedPosition.topBoundary,
      bottomBoundary: snappedPosition.bottomBoundary,
    });

    const anchorInitial = groupDragStateRef.current.initialById[id];

    if (!anchorInitial) {
      return;
    }

    const deltaX = snappedPosition.x - anchorInitial.screenX;
    const deltaY = snappedPosition.y - anchorInitial.screenY;
    const updatesById: Record<string, { time: number; value: number }> = {};

    for (const [keyframeId, initial] of Object.entries(groupDragStateRef.current.initialById)) {
      const nextScreenPosition = getSnappedPosition({
        x: initial.screenX + deltaX,
        y: initial.screenY + deltaY,
      });

      updatesById[keyframeId] = {
        time: Math.max(0, Math.min(currentTime + (nextScreenPosition.x - centerX) / pixelsPerMs, duration)),
        value: Math.max(-MAX_VALUE, Math.min(centerY - nextScreenPosition.y, MAX_VALUE)),
      };
    }

    updateKeyframes(updatesById);
  };

  const handleKeyframeDragEnd = (id: string, event: Konva.KonvaEventObject<DragEvent>) => {
    handleKeyframeDragMove(id, event);
    groupDragStateRef.current = { active: false, anchorId: null, initialById: {} };
    resetSnapGuides();
  };

  const marqueeRect = {
    x: Math.min(marqueeState.startX, marqueeState.currentX),
    y: Math.min(marqueeState.startY, marqueeState.currentY),
    width: Math.abs(marqueeState.currentX - marqueeState.startX),
    height: Math.abs(marqueeState.currentY - marqueeState.startY),
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
                stroke={snapGuides.horizontal ? CENTER_GUIDE_YELLOW : 'rgba(255,255,255,0.12)'}
                strokeWidth={snapGuides.horizontal ? 2 : 1}
                dash={snapGuides.horizontal ? [10, 6] : [8, 8]}
                shadowColor={snapGuides.horizontal ? 'rgba(251,191,36,0.6)' : 'transparent'}
                shadowBlur={snapGuides.horizontal ? 12 : 0}
                listening={false}
              />
              <Line
                points={[0, topBoundY, size.width, topBoundY]}
                stroke={snapGuides.topBoundary ? CENTER_GUIDE_YELLOW : 'rgba(255,255,255,0.62)'}
                strokeWidth={snapGuides.topBoundary ? 3 : 2}
                shadowColor={snapGuides.topBoundary ? 'rgba(251,191,36,0.6)' : 'transparent'}
                shadowBlur={snapGuides.topBoundary ? 12 : 0}
                listening={false}
              />
              <Line
                points={[0, bottomBoundY, size.width, bottomBoundY]}
                stroke={snapGuides.bottomBoundary ? CENTER_GUIDE_YELLOW : 'rgba(255,255,255,0.62)'}
                strokeWidth={snapGuides.bottomBoundary ? 3 : 2}
                shadowColor={snapGuides.bottomBoundary ? 'rgba(251,191,36,0.6)' : 'transparent'}
                shadowBlur={snapGuides.bottomBoundary ? 12 : 0}
                listening={false}
              />
              <Line
                points={[centerX, 0, centerX, STAGE_HEIGHT]}
                stroke={snapGuides.vertical ? CENTER_GUIDE_YELLOW : 'rgba(255,255,255,0.12)'}
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

              {screenKeyframes.map((keyframe) => {
                const isSelected = selectedKeyframeIds.includes(keyframe.id);

                return (
                  <Circle
                    key={keyframe.id}
                    x={keyframe.screenX}
                    y={keyframe.screenY}
                    radius={POINT_RADIUS}
                    fill={isSelected ? '#fef3c7' : '#e5e7eb'}
                    stroke={isSelected ? '#f59e0b' : '#fb923c'}
                    strokeWidth={isSelected ? 3 : 2}
                    draggable
                    dragBoundFunc={(position) => {
                      const snappedPosition = getSnappedPosition(position);
                      return { x: snappedPosition.x, y: snappedPosition.y };
                    }}
                    onPointerDown={(event) => {
                      event.cancelBubble = true;
                      const nextSelection = selectedKeyframeIds.includes(keyframe.id) ? selectedKeyframeIds : [keyframe.id];
                      setSelectedKeyframeIds(nextSelection);
                    }}
                    onDragStart={() => {
                      handleKeyframeDragStart(keyframe.id);
                    }}
                    onDragMove={(event) => {
                      handleKeyframeDragMove(keyframe.id, event);
                    }}
                    onDragEnd={(event) => {
                      handleKeyframeDragEnd(keyframe.id, event);
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
                );
              })}

              {marqueeState.active && marqueeRect.width > 0 && marqueeRect.height > 0 && (
                <Rect
                  x={marqueeRect.x}
                  y={marqueeRect.y}
                  width={marqueeRect.width}
                  height={marqueeRect.height}
                  fill="rgba(59,130,246,0.12)"
                  stroke="rgba(59,130,246,0.9)"
                  strokeWidth={1}
                  dash={[6, 4]}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}
