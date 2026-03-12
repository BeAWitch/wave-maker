import Konva from 'konva';

import type { Keyframe } from '../store/useStore';
import { getCurvePoints, getInterpolatedValue } from './animation';
import {
  CURVE_STROKE_WIDTH,
  CURVE_TENSION,
  DEFAULT_BOUNDARY_COLOR,
  DEFAULT_GUIDE_COLOR,
  MAX_VALUE,
  SAMPLE_STEP_MS,
  STAGE_HEIGHT,
} from './canvasScene';

const EXPORT_PADDING_X = 80;
const MAX_EXPORT_WIDTH = 8192;
const MAX_EXPORT_HEIGHT = 4320;
const EXPORT_PIXEL_RATIO = 2;

export interface ExportVideoOptions {
  startTime: number;
  endTime: number;
  fps: number;
  videoBitsPerSecond: number;
  keyframes: Keyframe[];
  pixelsPerMs: number;
  transparentBackground: boolean;
  backgroundColor: string;
  showCenterLine: boolean;
  showBoundaryLines: boolean;
  curveColor: string;
  curveOpacity: number;
  dotColor: string;
  dotOpacity: number;
  dotShape: 'circle' | 'square' | 'triangle';
  dotSize: number;
  onProgress?: (progress: number) => void;
}

export interface ExportVideoResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
}

interface ExportRenderer {
  container: HTMLDivElement;
  stage: Konva.Stage;
  layer: Konva.Layer;
  sceneCanvas: HTMLCanvasElement;
  curveLine: Konva.Line;
  marker: Konva.Shape;
  width: number;
  height: number;
}

export function getExportWidth(duration: number, pixelsPerMs: number) {
  return toEvenNumber(duration * pixelsPerMs + EXPORT_PADDING_X * 2);
}

export function getExportHeight() {
  return STAGE_HEIGHT;
}

export function getMaxExportWidth() {
  return MAX_EXPORT_WIDTH;
}

export function getSupportedExportMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return null;
  }

  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

export async function exportVideo(options: ExportVideoOptions): Promise<ExportVideoResult> {
  const duration = Math.max(1, options.endTime - options.startTime);
  const width = getExportWidth(duration, options.pixelsPerMs);
  const height = getExportHeight();

  if (width > MAX_EXPORT_WIDTH || height > MAX_EXPORT_HEIGHT) {
    throw new Error(`Export size ${width}x${height} is too large. Reduce px/ms before exporting.`);
  }

  if (options.endTime <= options.startTime) {
    throw new Error('End time must be greater than start time.');
  }

  if (options.keyframes.length === 0) {
    throw new Error('Add at least one keyframe before exporting.');
  }

  const mimeType = getSupportedExportMimeType();

  if (!mimeType) {
    throw new Error('This browser does not support WebM export with MediaRecorder.');
  }

  const renderer = createExportRenderer(options, width, height);
  const recordingCanvas = document.createElement('canvas');
  recordingCanvas.width = width * EXPORT_PIXEL_RATIO;
  recordingCanvas.height = height * EXPORT_PIXEL_RATIO;

  const recordingContext = recordingCanvas.getContext('2d', { alpha: true });

  if (!recordingContext) {
    destroyExportRenderer(renderer);
    throw new Error('Unable to create export recording canvas context.');
  }

  recordingContext.imageSmoothingEnabled = true;

  const stream = recordingCanvas.captureStream(0);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.videoBitsPerSecond,
  });
  const chunks: Blob[] = [];
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;

  const blobPromise = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });

    recorder.addEventListener('error', () => {
      reject(new Error('Video export failed while recording.'));
    });

    recorder.addEventListener('stop', () => {
      stream.getTracks().forEach((streamTrack) => streamTrack.stop());

      if (chunks.length === 0) {
        reject(new Error('No video data was produced during export.'));
        return;
      }

      resolve(new Blob(chunks, { type: mimeType }));
    });
  });

  try {
    recorder.start(250);

    const frameDurationMs = 1000 / Math.max(options.fps, 1);
    const totalFrames = Math.max(1, Math.ceil(duration / frameDurationMs));
    const startedAt = performance.now();

    for (let frameIndex = 0; frameIndex <= totalFrames; frameIndex += 1) {
      const elapsed = frameIndex * frameDurationMs;
      const currentTime = Math.min(options.endTime, options.startTime + elapsed);
      renderFrame(renderer, recordingContext, currentTime, options);
      track?.requestFrame?.();
      options.onProgress?.(elapsed / duration);

      if (frameIndex < totalFrames) {
        await waitUntil(startedAt + (frameIndex + 1) * frameDurationMs);
      }
    }

    await wait(Math.max(120, Math.round(frameDurationMs)));

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }

    const blob = await blobPromise;
    options.onProgress?.(1);

    return {
      blob,
      mimeType,
      width,
      height,
    };
  } finally {
    destroyExportRenderer(renderer);
  }
}

function createExportRenderer(
  options: ExportVideoOptions,
  width: number,
  height: number
): ExportRenderer {
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  container.style.top = '0';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.pointerEvents = 'none';
  container.style.opacity = '0';
  document.body.appendChild(container);

  const stage = new Konva.Stage({
    container,
    width,
    height,
  });
  const layer = new Konva.Layer({
    clearBeforeDraw: true,
    imageSmoothingEnabled: true,
    listening: false,
  });
  stage.add(layer);
  layer.getCanvas().setPixelRatio(EXPORT_PIXEL_RATIO);
  layer.setSize({ width, height });

  const backgroundNode = createBackgroundNode(options, width, height);

  if (backgroundNode) {
    layer.add(backgroundNode);
  }

  const centerY = height / 2;

  if (options.showCenterLine) {
    layer.add(
      new Konva.Line({
        points: [0, centerY, width, centerY],
        stroke: DEFAULT_GUIDE_COLOR,
        strokeWidth: 1,
        dash: [8, 8],
        listening: false,
      })
    );
  }

  if (options.showBoundaryLines) {
    const topBoundY = centerY - MAX_VALUE;
    const bottomBoundY = centerY + MAX_VALUE;

    layer.add(
      new Konva.Line({
        points: [0, topBoundY, width, topBoundY],
        stroke: DEFAULT_BOUNDARY_COLOR,
        strokeWidth: 2,
        listening: false,
      })
    );
    layer.add(
      new Konva.Line({
        points: [0, bottomBoundY, width, bottomBoundY],
        stroke: DEFAULT_BOUNDARY_COLOR,
        strokeWidth: 2,
        listening: false,
      })
    );
  }

  const curveLine = new Konva.Line({
    points: [],
    stroke: options.curveColor,
    opacity: options.curveOpacity,
    strokeWidth: CURVE_STROKE_WIDTH,
    lineJoin: 'round',
    lineCap: 'round',
    tension: CURVE_TENSION,
    listening: false,
  });

  let marker: Konva.Shape;
  if (options.dotShape === 'square') {
    marker = new Konva.Rect({
      x: width / 2,
      y: centerY,
      width: options.dotSize * 2,
      height: options.dotSize * 2,
      offsetX: options.dotSize,
      offsetY: options.dotSize,
      fill: options.dotColor,
      opacity: options.dotOpacity,
      listening: false,
    });
  } else if (options.dotShape === 'triangle') {
    marker = new Konva.RegularPolygon({
      x: width / 2,
      y: centerY,
      sides: 3,
      radius: options.dotSize * 1.2,
      fill: options.dotColor,
      opacity: options.dotOpacity,
      listening: false,
    });
  } else {
    marker = new Konva.Circle({
      x: width / 2,
      y: centerY,
      radius: options.dotSize,
      fill: options.dotColor,
      opacity: options.dotOpacity,
      listening: false,
    });
  }

  layer.add(curveLine);
  layer.add(marker);
  layer.draw();

  return {
    container,
    stage,
    layer,
    sceneCanvas: layer.getNativeCanvasElement(),
    curveLine,
    marker,
    width,
    height,
  };
}

function createBackgroundNode(
  options: ExportVideoOptions,
  width: number,
  height: number
) {
  if (options.transparentBackground) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width * EXPORT_PIXEL_RATIO;
  canvas.height = height * EXPORT_PIXEL_RATIO;

  const context = canvas.getContext('2d', { alpha: true });

  if (!context) {
    throw new Error('Unable to create export background canvas context.');
  }

  context.scale(EXPORT_PIXEL_RATIO, EXPORT_PIXEL_RATIO);
  context.clearRect(0, 0, width, height);

  drawDefaultBackground(context, width, height, options.backgroundColor);

  return new Konva.Image({
    image: canvas,
    x: 0,
    y: 0,
    width,
    height,
    listening: false,
  });
}

function destroyExportRenderer(renderer: ExportRenderer) {
  renderer.stage.destroy();
  renderer.container.remove();
}

function renderFrame(
  renderer: ExportRenderer,
  recordingContext: CanvasRenderingContext2D,
  currentTime: number,
  options: ExportVideoOptions
) {
  const centerX = renderer.width / 2;
  const centerY = renderer.height / 2;
  const curvePoints = getCurvePoints(
    options.keyframes,
    currentTime,
    renderer.width,
    centerX,
    centerY,
    options.pixelsPerMs,
    SAMPLE_STEP_MS
  );
  const currentValue = getInterpolatedValue(options.keyframes, currentTime) ?? 0;

  renderer.curveLine.points(curvePoints);
  renderer.curveLine.visible(curvePoints.length > 3);
  renderer.marker.y(centerY - currentValue);
  renderer.layer.draw();

  recordingContext.clearRect(0, 0, recordingContext.canvas.width, recordingContext.canvas.height);
  recordingContext.drawImage(renderer.sceneCanvas, 0, 0);
}

function drawDefaultBackground(context: CanvasRenderingContext2D, width: number, height: number, backgroundColor: string) {
  context.save();
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function toEvenNumber(value: number) {
  const roundedValue = Math.max(2, Math.round(value));
  return roundedValue % 2 === 0 ? roundedValue : roundedValue + 1;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitUntil(targetTimestamp: number) {
  const remaining = targetTimestamp - performance.now();

  if (remaining <= 1) {
    return;
  }

  await wait(remaining);
}
