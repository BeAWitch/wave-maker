import type { Keyframe } from '../store/useStore';

export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export interface ScreenKeyframe extends Keyframe {
  screenX: number;
  screenY: number;
}

export function getInterpolatedValue(keyframes: Keyframe[], currentTime: number) {
  if (keyframes.length === 0) {
    return null;
  }

  if (keyframes.length === 1) {
    return keyframes[0].value;
  }

  if (currentTime <= keyframes[0].time) {
    return keyframes[0].value;
  }

  if (currentTime >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].value;
  }

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const startKeyframe = keyframes[index];
    const endKeyframe = keyframes[index + 1];

    if (currentTime >= startKeyframe.time && currentTime < endKeyframe.time) {
      const segmentDuration = endKeyframe.time - startKeyframe.time;

      if (segmentDuration <= 0) {
        return endKeyframe.value;
      }

      const progress = (currentTime - startKeyframe.time) / segmentDuration;
      const easingFn = easings[startKeyframe.easing] ?? easings.linear;
      const easedProgress = easingFn(progress);

      return startKeyframe.value + (endKeyframe.value - startKeyframe.value) * easedProgress;
    }
  }

  return keyframes[keyframes.length - 1].value;
}

export function getScreenKeyframes(
  keyframes: Keyframe[],
  currentTime: number,
  centerX: number,
  centerY: number,
  pixelsPerMs: number
): ScreenKeyframe[] {
  return keyframes.map((keyframe) => ({
    ...keyframe,
    screenX: centerX + (keyframe.time - currentTime) * pixelsPerMs,
    screenY: centerY - keyframe.value,
  }));
}

export function getCurvePoints(
  keyframes: Keyframe[],
  currentTime: number,
  width: number,
  centerX: number,
  centerY: number,
  pixelsPerMs: number,
  sampleStepMs: number
) {
  if (keyframes.length < 2) {
    return [];
  }

  const visibleStartTime = currentTime - centerX / pixelsPerMs;
  const visibleEndTime = currentTime + (width - centerX) / pixelsPerMs;
  const firstTime = keyframes[0].time;
  const lastTime = keyframes[keyframes.length - 1].time;
  const sampleStartTime = Math.max(visibleStartTime, firstTime);
  const sampleEndTime = Math.min(visibleEndTime, lastTime);
  const points: number[] = [];

  if (sampleStartTime > sampleEndTime) {
    return [];
  }

  for (let time = sampleStartTime; time <= sampleEndTime; time += sampleStepMs) {
    const value = getInterpolatedValue(keyframes, time);

    if (value === null) {
      continue;
    }

    const x = centerX + (time - currentTime) * pixelsPerMs;
    const y = centerY - value;
    points.push(x, y);
  }

  const finalValue = getInterpolatedValue(keyframes, sampleEndTime);

  if (finalValue !== null) {
    const finalX = centerX + (sampleEndTime - currentTime) * pixelsPerMs;
    points.push(finalX, centerY - finalValue);
  }

  return points;
}
