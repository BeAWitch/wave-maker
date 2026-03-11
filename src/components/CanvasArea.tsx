import { useMemo, useRef } from 'react';
import { Circle, Layer, Line, Stage } from 'react-konva';
import type Konva from 'konva';

import { useContainerSize } from '../hooks/useContainerSize';
import { useStore } from '../store/useStore';
import { getCurvePoints, getInterpolatedValue, getScreenKeyframes } from '../utils/animation';

const STAGE_HEIGHT = 600;
const MAX_VALUE = 200;
const PIXELS_PER_MS = 0.12;
const SAMPLE_STEP_MS = 16;
const POINT_RADIUS = 8;

export function CanvasArea() {
  const { currentTime, duration, keyframes, updateKeyframe } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useContainerSize(containerRef);

  const centerX = size.width / 2;
  const centerY = STAGE_HEIGHT / 2;
  const topBoundY = centerY - MAX_VALUE;
  const bottomBoundY = centerY + MAX_VALUE;
  const minBoundX = centerX - currentTime * PIXELS_PER_MS;
  const maxBoundX = centerX + (duration - currentTime) * PIXELS_PER_MS;

  const screenKeyframes = useMemo(
    () => getScreenKeyframes(keyframes, currentTime, centerX, centerY, PIXELS_PER_MS),
    [centerX, centerY, currentTime, keyframes]
  );

  const curvePoints = useMemo(
    () => getCurvePoints(keyframes, currentTime, size.width, centerX, centerY, PIXELS_PER_MS, SAMPLE_STEP_MS),
    [centerX, centerY, currentTime, keyframes, size.width]
  );

  const currentValue = getInterpolatedValue(keyframes, currentTime) ?? 0;
  const markerY = centerY - currentValue;

  const handleDragMove = (id: string, event: Konva.KonvaEventObject<DragEvent>) => {
    const nextScreenX = event.target.x();
    const nextScreenY = event.target.y();
    const nextTime = currentTime + (nextScreenX - centerX) / PIXELS_PER_MS;
    const nextValue = centerY - nextScreenY;

    updateKeyframe(id, {
      time: Math.max(0, Math.min(nextTime, duration)),
      value: Math.max(-MAX_VALUE, Math.min(nextValue, MAX_VALUE)),
    });
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
        }}
      >
        <div className="absolute top-4 left-6 z-10 pointer-events-none font-mono text-xs uppercase tracking-wider text-zinc-500">
          Workspace: {size.width} x {STAGE_HEIGHT}
        </div>

        {size.width > 0 && (
          <Stage width={size.width} height={STAGE_HEIGHT}>
            <Layer>
              <Line points={[0, centerY, size.width, centerY]} stroke="rgba(255,255,255,0.82)" strokeWidth={2} />
              <Line points={[0, topBoundY, size.width, topBoundY]} stroke="rgba(255,255,255,0.42)" strokeWidth={2} />
              <Line points={[0, bottomBoundY, size.width, bottomBoundY]} stroke="rgba(255,255,255,0.42)" strokeWidth={2} />
              <Line points={[centerX, 0, centerX, STAGE_HEIGHT]} stroke="rgba(255,255,255,0.12)" strokeWidth={1} dash={[8, 8]} />

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
                  fill="#e5e7eb"
                  stroke="#fb923c"
                  strokeWidth={2}
                  draggable
                  dragBoundFunc={(position) => ({
                    x: Math.max(minBoundX, Math.min(position.x, maxBoundX)),
                    y: Math.max(topBoundY, Math.min(position.y, bottomBoundY)),
                  })}
                  onDragMove={(event) => handleDragMove(keyframe.id, event)}
                  onDragEnd={(event) => handleDragMove(keyframe.id, event)}
                  onMouseEnter={() => {
                    document.body.style.cursor = 'grab';
                  }}
                  onMouseLeave={() => {
                    document.body.style.cursor = 'default';
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
