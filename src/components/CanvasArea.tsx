import { Stage, Layer, Circle, Line } from 'react-konva';
import { useStore } from '../store/useStore';
import { getInterpolatedPosition } from '../utils/animation';

export function CanvasArea() {
  const { keyframes, updateKeyframe, currentTime } = useStore();

  const movingPos = getInterpolatedPosition(
    keyframes.map(kf => ({ time: kf.time, x: kf.x, y: kf.y, easing: kf.easing })),
    currentTime
  );

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-800 relative overflow-hidden">
      <div className="absolute top-4 left-4 text-gray-400 text-sm">
        Canvas: 800 x 600
      </div>
      
      <div className="bg-white rounded shadow-2xl overflow-hidden border border-gray-600 relative">
        <Stage width={800} height={600}>
          <Layer>
            {/* Background grid or guides can go here */}
            
            {/* Draw connecting lines (Placeholder logic for now) */}
            {keyframes.length > 1 && (
              <Line
                points={keyframes.flatMap(kf => [kf.x, kf.y])}
                stroke="#3b82f6"
                strokeWidth={2}
                lineJoin="round"
                lineCap="round"
                tension={0.3} // Rough visual tension for now
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
                    radius={6}
                    fill="rgba(59, 130, 246, 0.3)" // Blue, 30% opacity
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
                radius={8}
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth={2}
                draggable
                onDragStart={(e) => {
                  e.target.moveToTop();
                }}
                onDragMove={(e) => {
                  updateKeyframe(kf.id, { x: e.target.x(), y: e.target.y() });
                }}
                onDragEnd={(e) => {
                  updateKeyframe(kf.id, { x: e.target.x(), y: e.target.y() });
                }}
                shadowColor="black"
                shadowBlur={5}
                shadowOpacity={0.2}
              />
            ))}

            {/* Current Animating Object (The Moving Dot) */}
            {movingPos && (
              <Circle
                x={movingPos.x}
                y={movingPos.y}
                radius={12}
                fill="#ef4444" // Red for the animating object
                shadowColor="black"
                shadowBlur={10}
                shadowOpacity={0.3}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
