export const STAGE_HEIGHT = 600;
export const MAX_VALUE = 200;
export const SAMPLE_STEP_MS = 16;
export const POINT_RADIUS = 8;
export const DOT_RADIUS = 16;
export const CURVE_STROKE = '#f4f4f5';
export const CURVE_STROKE_WIDTH = 6;
export const CURVE_TENSION = 0.45;
export const DOT_FILL = 'rgba(255,255,255,0.28)';
export const GRID_SIZE = 24;
export const GRID_DOT_RADIUS = 1;
export const GRID_DOT_COLOR = '#3f3f46';
export const CANVAS_BOUNDARY_INSET_PX = 24;
export const DEFAULT_OPAQUE_BACKGROUND = '#18181b';
export const DEFAULT_GUIDE_COLOR = 'rgba(255,255,255,0.12)';
export const DEFAULT_BOUNDARY_COLOR = 'rgba(255,255,255,0.62)';

export function getDefaultCanvasPixelsPerMs(width: number, duration: number) {
  if (width <= 0 || duration <= 0) {
    return 1;
  }

  const fittedWidth = Math.max(width - CANVAS_BOUNDARY_INSET_PX * 2, width * 0.25);
  return fittedWidth / duration;
}

export function getScreenX(time: number, currentTime: number, centerX: number, pixelsPerMs: number) {
  return centerX + (time - currentTime) * pixelsPerMs;
}

export function getScreenY(value: number, centerY: number) {
  return centerY - value;
}
