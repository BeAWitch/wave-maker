import { Play, Pause, CircleDot, Settings, Download } from 'lucide-react';
import { useStore } from '../store/useStore';

export function ControlsBar() {
  const { isPlaying, setIsPlaying, addKeyframe, selectedCurveType, setCurveType } = useStore();

  return (
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

          <div className="h-6 w-px bg-zinc-800" />

          <button
            onClick={() => addKeyframe()}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-sm font-medium text-zinc-200"
          >
            <CircleDot size={16} className="text-emerald-400" />
            <span>Add Keyframe</span>
          </button>
          
          <div className="h-6 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <Settings size={14} className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400">Curve:</span>
            <select 
              value={selectedCurveType}
              onChange={(e) => setCurveType(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 px-2 py-1 rounded outline-none focus:border-blue-500 transition-colors cursor-pointer w-28"
            >
              <option value="linear" className="bg-zinc-900 text-zinc-100">Linear</option>
              <option value="easeIn" className="bg-zinc-900 text-zinc-100">Ease In</option>
              <option value="easeOut" className="bg-zinc-900 text-zinc-100">Ease Out</option>
              <option value="easeInOut" className="bg-zinc-900 text-zinc-100">Ease In/Out</option>
              <option value="elastic" className="bg-zinc-900 text-zinc-100">Elastic</option>
            </select>
          </div>
        </div>

        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Download size={16} className="text-zinc-400" />
          Export
        </button>

      </div>
    </div>
  );
}
