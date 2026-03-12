import type { CurveType, EasingMode, Keyframe } from '../store/useStore';

const BEZIER_CONTROL_POINTS = {
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
} as const;

export interface ScreenKeyframe extends Keyframe {
  screenX: number;
  screenY: number;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

function applyCurveType(curveType: CurveType, progress: number) {
  const safeProgress = clampProgress(progress);

  switch (curveType) {
    case 'quadratic':
      return safeProgress * safeProgress;
    case 'cubic':
      return safeProgress * safeProgress * safeProgress;
    case 'bezier':
      return safeProgress;
    case 'linear':
    default:
      return safeProgress;
  }
}

function cubicBezierAtTime(progress: number, x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (time: number) => ((ax * time + bx) * time + cx) * time;
  const sampleCurveY = (time: number) => ((ay * time + by) * time + cy) * time;
  const sampleCurveDerivativeX = (time: number) => (3 * ax * time + 2 * bx) * time + cx;

  let time = progress;

  for (let index = 0; index < 6; index += 1) {
    const x = sampleCurveX(time) - progress;
    const derivative = sampleCurveDerivativeX(time);

    if (Math.abs(x) < 1e-6 || Math.abs(derivative) < 1e-6) {
      break;
    }

    time -= x / derivative;
  }

  return sampleCurveY(clampProgress(time));
}

function applyEasingMode(progress: number, easingMode: EasingMode, curveType: CurveType) {
  const curvedProgress = applyCurveType(curveType, progress);

  if (curveType === 'bezier') {
    const [x1, y1, x2, y2] = BEZIER_CONTROL_POINTS[easingMode];
    return cubicBezierAtTime(curvedProgress, x1, y1, x2, y2);
  }

  switch (easingMode) {
    case 'easeIn':
      return curvedProgress;
    case 'easeOut':
      return 1 - applyCurveType(curveType, 1 - progress);
    case 'easeInOut':
    default:
      if (progress < 0.5) {
        return applyCurveType(curveType, progress * 2) / 2;
      }

      return 1 - applyCurveType(curveType, (1 - progress) * 2) / 2;
  }
}

function getSegmentProgress(keyframe: Keyframe, progress: number) {
  return applyEasingMode(progress, keyframe.easingMode, keyframe.curveType);
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
      const easedProgress = getSegmentProgress(endKeyframe, progress);

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
