import { useRef } from 'react';
import { Stage, Layer, Circle, Line } from 'react-konva';
import { useStore } from '../store/useStore';
import { getInterpolatedPosition } from '../utils/animation';
import { useContainerSize } from '../hooks/useContainerSize';

export function CanvasArea() {
  const { keyframes, updateKeyframe, currentTime } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const size = useContainerSize(containerRef);

  const movingPos = getInterpolatedPosition(
    keyframes.map(kf => ({ time: kf.time, x: kf.x, y: kf.y, easing: kf.easing })),
    currentTime
  );

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-[#09090b] relative overflow-hidden">
      <div 
        ref={containerRef}
        className="w-full relative shadow-[0_0_40px_rgba(0,0,0,0.5)] border-y border-zinc-800 overflow-hidden flex-shrink-0"
        style={{
          height: '600px', // Fixed height, width fills exactly 100% of the screen
          backgroundColor: '#18181b',
          backgroundImage: 'radial-gradient(circle, #3f3f46 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div className="absolute top-4 left-6 text-zinc-500 font-mono text-xs uppercase tracking-wider pointer-events-none z-10">
          Workspace: {size.width} x 600
        </div>
        
        {size.width > 0 && (
          <Stage width={size.width} height={600}>
          <Layer>
            {/* Draw connecting lines */}
            {keyframes.length > 1 && (
              <Line
                points={keyframes.flatMap(kf => [kf.x, kf.y])}
                stroke="#3b82f6"
                strokeWidth={2}
                lineJoin="round"
                lineCap="round"
                dash={[10, 5]} // Make the path dashed for a "blueprint" feel
                opacity={0.6}
                tension={0} // Straight lines for the visual path for now
              />
            )}

            {/* Ghost Keyframes (Initial Positions) */}
            {keyframes.map((kf) => {
              if (kf.x !== kf.initialX || kf.y !== kf.initialY) {
                return (
                  <Circle
                    key={`ghost-${kf.id}`}
                    x={kf.initialX}
                    y={kf.initialY}
                    radius={5}
                    fill="transparent"
                    stroke="rgba(59, 130, 246, 0.4)"
                    strokeWidth={2}
                    dash={[4, 4]}
                  />
                );
              }
              return null;
            })}

            {/* Active Keyframes */}
            {keyframes.map((kf) => (
              <Circle
                key={kf.id}
                x={kf.x}
                y={kf.y}
                radius={7}
                fill="#18181b"
                stroke="#3b82f6"
                strokeWidth={3}
                draggable
                onDragStart={(e) => {
                  e.target.moveToTop();
                  // Visual feedback on drag
                  const node = e.target as any;
                  node.strokeWidth(4);
                  node.stroke('#60a5fa');
                }}
                onDragMove={(e) => {
                  updateKeyframe(kf.id, { x: e.target.x(), y: e.target.y() });
                }}
                onDragEnd={(e) => {
                  updateKeyframe(kf.id, { x: e.target.x(), y: e.target.y() });
                  // Reset visual feedback
                  const node = e.target as any;
                  node.strokeWidth(3);
                  node.stroke('#3b82f6');
                }}
                onMouseEnter={() => {
                  document.body.style.cursor = 'grab';
                }}
                onMouseLeave={() => {
                  document.body.style.cursor = 'default';
                }}
                shadowColor="rgba(59, 130, 246, 0.5)"
                shadowBlur={10}
              />
            ))}

            {/* Current Animating Object (The Moving Dot) */}
            {movingPos && (
              <Circle
                x={movingPos.x}
                y={movingPos.y}
                radius={10}
                fill="#ef4444" // Red for the animating object
                shadowColor="#ef4444"
                shadowBlur={15}
                shadowOpacity={0.6}
              />
            )}
          </Layer>
        </Stage>
        )}
      </div>
    </div>
  );
}
