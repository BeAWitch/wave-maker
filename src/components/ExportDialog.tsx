import { useEffect, useMemo, useState } from 'react';
import { Download, LoaderCircle, Sparkles, X } from 'lucide-react';

import { useStore } from '../store/useStore';
import { DEFAULT_OPAQUE_BACKGROUND } from '../utils/canvasScene';
import {
  exportVideo,
  getExportHeight,
  getExportWidth,
  getMaxExportWidth,
  getSupportedExportMimeType,
} from '../utils/exportVideo';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const FPS_OPTIONS = [24, 30, 48, 60, 90, 120, 144] as const;

const BITRATE_OPTIONS = [
  { label: '2 Mbps', value: 2_000_000 },
  { label: '4 Mbps', value: 4_000_000 },
  { label: '8 Mbps', value: 8_000_000 },
  { label: '16 Mbps', value: 16_000_000 },
  { label: '32 Mbps', value: 32_000_000 },
] as const;

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { duration, keyframes, pixelsPerMs, setIsPlaying } = useStore();
  const [fps, setFps] = useState<number>(60);
  const [videoBitsPerSecond, setVideoBitsPerSecond] = useState<number>(16_000_000);
  const [exportPixelsPerMs, setExportPixelsPerMs] = useState<number>(pixelsPerMs);
  const [transparentBackground, setTransparentBackground] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_OPAQUE_BACKGROUND);
  const [showCenterLine, setShowCenterLine] = useState(false);
  const [showBoundaryLines, setShowBoundaryLines] = useState(false);
  const [trimToKeyframes, setTrimToKeyframes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const exportMimeType = getSupportedExportMimeType();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setExportPixelsPerMs(pixelsPerMs);
    setErrorMessage(null);
    setProgress(0);
  }, [isOpen, pixelsPerMs]);

  useEffect(() => {
    if (!isOpen) {
      setBackgroundColor(DEFAULT_OPAQUE_BACKGROUND);
      setTransparentBackground(true);
      setShowCenterLine(false);
      setShowBoundaryLines(false);
      setTrimToKeyframes(true);
      setFps(60);
      setVideoBitsPerSecond(16_000_000);
      setProgress(0);
      setErrorMessage(null);
      setIsExporting(false);
    }
  }, [isOpen]);

  const actualStartTime = trimToKeyframes && keyframes.length > 0 ? keyframes[0].time : 0;
  const actualEndTime = trimToKeyframes && keyframes.length > 0 ? keyframes[keyframes.length - 1].time : duration;
  const exportDuration = Math.max(1, actualEndTime - actualStartTime);
  
  const exportWidth = useMemo(() => getExportWidth(exportDuration, exportPixelsPerMs), [exportDuration, exportPixelsPerMs]);
  const exportHeight = getExportHeight();
  const widthTooLarge = exportWidth > getMaxExportWidth();
  const canExport = keyframes.length > 0 && !isExporting && !widthTooLarge && Boolean(exportMimeType);
  const progressPercent = Math.max(0, Math.min(100, Math.round(progress * 100)));

  if (!isOpen) {
    return null;
  }

  const handleStartExport = async () => {
    if (!canExport) {
      return;
    }

    try {
      setIsPlaying(false);
      setIsExporting(true);
      setErrorMessage(null);
      setProgress(0);

      const result = await exportVideo({
        startTime: actualStartTime,
        endTime: actualEndTime,
        fps,
        videoBitsPerSecond,
        keyframes,
        pixelsPerMs: exportPixelsPerMs,
        transparentBackground,
        backgroundColor,
        showCenterLine,
        showBoundaryLines,
        onProgress: setProgress,
      });

      const extension = result.mimeType.includes('webm') ? 'webm' : 'video';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const downloadUrl = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `wavemaker-export-${timestamp}.${extension}`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-amber-300">
              <Sparkles size={16} />
              <span className="text-xs font-semibold uppercase tracking-[0.3em]">Export Video</span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-100">Render the moving dot animation</h2>
            <p className="mt-1 text-sm text-zinc-400">Export uses the current canvas zoom as `px/ms` and renders a clean presentation scene.</p>
          </div>
          <button
            type="button"
            className="rounded-md border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            onClick={onClose}
            disabled={isExporting}
            title="Close export dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <label className="block rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                <span>Canvas zoom</span>
                <span className="font-mono text-blue-400">{exportPixelsPerMs.toFixed(3)} px/ms</span>
              </div>
              <input
                type="range"
                min="0.03"
                max="2"
                step="0.01"
                value={exportPixelsPerMs}
                onChange={(event) => setExportPixelsPerMs(Number(event.target.value))}
                className="w-full accent-blue-500"
                disabled={isExporting}
              />
              <p className="mt-2 text-xs text-zinc-500">Defaults to the current canvas zoom. Higher values create a wider export.</p>
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <span className="mb-2 block text-sm text-zinc-300">Frame rate</span>
                <select
                  value={fps}
                  onChange={(event) => setFps(Number(event.target.value))}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  disabled={isExporting}
                >
                  {FPS_OPTIONS.map((value) => (
                    <option key={`fps-${value}`} value={value}>
                      {value} FPS
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <span className="mb-2 block text-sm text-zinc-300">Bitrate</span>
                <select
                  value={videoBitsPerSecond}
                  onChange={(event) => setVideoBitsPerSecond(Number(event.target.value))}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500"
                  disabled={isExporting}
                >
                  {BITRATE_OPTIONS.map((opt) => (
                    <option key={`bitrate-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <span className="mb-2 block text-sm text-zinc-300">Output size</span>
                <div className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100">
                  {exportWidth} x {exportHeight}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-zinc-300">Background Color</span>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 transition-colors hover:bg-zinc-900">
                  <span className="text-xs font-mono text-zinc-300">{backgroundColor.toUpperCase()}</span>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(event) => {
                      setBackgroundColor(event.target.value);
                      setTransparentBackground(false);
                    }}
                    disabled={isExporting}
                    className="h-5 w-5 cursor-pointer appearance-none rounded border-none bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-zinc-700"
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={transparentBackground}
                  onChange={(event) => setTransparentBackground(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-blue-500"
                  disabled={isExporting}
                />
                Transparent background
              </label>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <span className="mb-3 block text-sm text-zinc-300">Guides</span>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={showCenterLine}
                    onChange={(event) => setShowCenterLine(event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-blue-500"
                    disabled={isExporting}
                  />
                  Show center line
                </label>
                <label className="flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={showBoundaryLines}
                    onChange={(event) => setShowBoundaryLines(event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-blue-500"
                    disabled={isExporting}
                  />
                  Show top and bottom bounds
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <span className="mb-3 block text-sm text-zinc-300">Timeline</span>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={trimToKeyframes}
                    onChange={(event) => setTrimToKeyframes(event.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-blue-500"
                    disabled={isExporting || keyframes.length === 0}
                  />
                  Trim video to first and last keyframe
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Export readiness</div>
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between">
                  <span>Keyframes</span>
                  <span className={keyframes.length > 0 ? 'text-emerald-300' : 'text-rose-300'}>{keyframes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration</span>
                  <span className="font-mono text-zinc-100">{(exportDuration / 1000).toFixed(2)}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Format</span>
                  <span className="font-mono text-zinc-100">{exportMimeType ?? 'Unsupported'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="mb-3 text-sm text-zinc-300">Progress</div>
              <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 transition-[width] duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>{isExporting ? 'Rendering frames...' : 'Ready to export'}</span>
                <span>{progressPercent}%</span>
              </div>
            </div>

            {widthTooLarge && (
              <div className="rounded-xl border border-amber-700/60 bg-amber-500/10 p-4 text-sm text-amber-100">
                Export width exceeds {getMaxExportWidth()} px. Lower `px/ms` before exporting.
              </div>
            )}

            {!exportMimeType && (
              <div className="rounded-xl border border-amber-700/60 bg-amber-500/10 p-4 text-sm text-amber-100">
                This browser does not support WebM recording through `MediaRecorder`.
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-rose-700/60 bg-rose-500/10 p-4 text-sm text-rose-100">
                {errorMessage}
              </div>
            )}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs leading-6 text-zinc-500">
              Transparent export is provided via WebM. If you choose a background color, the export becomes opaque.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartExport}
            disabled={!canExport}
            className="flex items-center gap-2 rounded-md border border-blue-500/50 bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isExporting ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Exporting...' : 'Export WebM'}
          </button>
        </div>
      </div>
    </div>
  );
}
