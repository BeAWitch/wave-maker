import { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, CircleDot, Settings, Download, Trash2 } from 'lucide-react';

import { ExportDialog } from './ExportDialog';
import { useStore, type CurveType, type EasingMode } from '../store/useStore';

const CURVE_OPTIONS: Array<{ value: CurveType; label: string }> = [
  { value: 'linear', label: 'Linear' },
  { value: 'quadratic', label: 'Quadratic' },
  { value: 'cubic', label: 'Cubic' },
  { value: 'bezier', label: 'Bezier' },
];

const EASING_OPTIONS: Array<{ value: EasingMode; label: string }> = [
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In And Out' },
];

export function ControlsBar() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const {
    isPlaying,
    keyframes,
    selectedKeyframeIds,
    setCurrentTime,
    setIsPlaying,
    addKeyframe,
    copySelectedKeyframes,
    deleteSelectedKeyframes,
    pasteKeyframesAtCurrentTime,
    updateSelectedKeyframesCurveType,
    updateSelectedKeyframesEasingMode,
  } = useStore();

  const selectedKeyframes = keyframes.filter((keyframe) => selectedKeyframeIds.includes(keyframe.id));
  const firstSelectedKeyframe = selectedKeyframes[0] ?? null;
  const canEditCurve = selectedKeyframes.length > 0;
  const canEditEasing = selectedKeyframes.length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditableTarget = target instanceof HTMLElement && (
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      );

      if (isEditableTarget) {
        return;
      }

      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (isModifierPressed && event.key.toLowerCase() === 'c' && selectedKeyframeIds.length > 0) {
        event.preventDefault();
        copySelectedKeyframes();
        return;
      }

      if (isModifierPressed && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteKeyframesAtCurrentTime();
        return;
      }

      if (event.key !== 'Delete' || selectedKeyframeIds.length === 0) {
        return;
      }

      event.preventDefault();
      deleteSelectedKeyframes();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [copySelectedKeyframes, deleteSelectedKeyframes, pasteKeyframesAtCurrentTime, selectedKeyframeIds]);

  return (
    <>
      <div className="w-full flex items-center justify-between px-6 py-3 bg-[#18181b] border-b border-zinc-800 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4 bg-zinc-950/50 px-4 py-1.5 rounded-lg border border-zinc-800/50 shadow-inner w-full justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-10 h-10 flex items-center justify-center rounded-md transition-all ${
                isPlaying
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-blue-600/10 text-blue-500 hover:bg-blue-600/20'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentTime(0);
                setIsPlaying(true);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-zinc-800 text-zinc-300 transition-all hover:bg-zinc-700"
              title="Play from start"
            >
              <SkipBack size={18} />
            </button>

            <div className="h-6 w-px bg-zinc-800" />

            <button
              onClick={() => addKeyframe()}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm font-medium text-zinc-200"
            >
              <CircleDot size={16} className="text-emerald-400" />
              <span>Add Keyframe</span>
            </button>

            <button
              type="button"
              onClick={deleteSelectedKeyframes}
              disabled={selectedKeyframeIds.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium border disabled:cursor-not-allowed disabled:opacity-40 bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200"
              title="Delete selected keyframes"
            >
              <Trash2 size={16} className="text-rose-400" />
              <span>Delete Keyframes</span>
            </button>

            <div className="h-6 w-px bg-zinc-800" />

            <div className="flex items-center gap-3">
              <Settings size={14} className="text-zinc-500" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400">Curve Type:</span>
                <select
                  value={firstSelectedKeyframe?.curveType ?? 'linear'}
                  onChange={(e) => updateSelectedKeyframesCurveType(e.target.value as CurveType)}
                  disabled={!canEditCurve}
                  className="bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 px-2 py-1 rounded outline-none focus:border-blue-500 transition-colors cursor-pointer w-28 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {CURVE_OPTIONS.map((option) => (
                    <option key={`curve-${option.value}`} value={option.value} className="bg-zinc-900 text-zinc-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400">Easing:</span>
                <select
                  value={firstSelectedKeyframe?.easingMode ?? 'easeInOut'}
                  onChange={(e) => updateSelectedKeyframesEasingMode(e.target.value as EasingMode)}
                  disabled={!canEditEasing}
                  className="bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 px-2 py-1 rounded outline-none focus:border-blue-500 transition-colors cursor-pointer w-30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {EASING_OPTIONS.map((option) => (
                    <option key={`easing-${option.value}`} value={option.value} className="bg-zinc-900 text-zinc-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors flex items-center gap-2 text-sm font-medium text-zinc-200"
          >
            <Download size={16} className="text-zinc-400" />
            Export
          </button>
        </div>
      </div>
      <ExportDialog isOpen={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)} />
    </>
  );
}
