// Custom easing functions matching standard signatures
// t: current time (0-1)
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

export function getInterpolatedPosition(
  keyframes: { time: number; x: number; y: number; easing: keyof typeof easings }[],
  currentTime: number
) {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) return { x: keyframes[0].x, y: keyframes[0].y };

  // Before first keyframe
  if (currentTime <= keyframes[0].time) return { x: keyframes[0].x, y: keyframes[0].y };
  
  // After last keyframe
  if (currentTime >= keyframes[keyframes.length - 1].time) {
    const lastKf = keyframes[keyframes.length - 1];
    return { x: lastKf.x, y: lastKf.y };
  }

  // Find the segment we are in
  for (let i = 0; i < keyframes.length - 1; i++) {
    const startKf = keyframes[i];
    const endKf = keyframes[i + 1];

    if (currentTime >= startKf.time && currentTime < endKf.time) {
      // We are between startKf and endKf
      const duration = endKf.time - startKf.time;
      const progress = (currentTime - startKf.time) / duration;
      
      // Apply easing function defined on the *end* keyframe (or start, depends on convention. Let's say the start keyframe determines the curve *to* the next keyframe)
      const easingFn = easings[startKf.easing] || easings.linear;
      const easedProgress = easingFn(progress);

      const x = startKf.x + (endKf.x - startKf.x) * easedProgress;
      const y = startKf.y + (endKf.y - startKf.y) * easedProgress;

      return { x, y };
    }
  }

  return null;
}
