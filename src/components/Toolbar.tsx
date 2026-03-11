import { Play, Pause, CircleDot, Download, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Toolbar() {
  const { isPlaying, setIsPlaying, addKeyframe, selectedCurveType, setCurveType } = useStore();

  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 text-white border-b border-gray-700">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          WaveMaker
        </h1>
        
        <div className="h-6 w-px bg-gray-700 mx-2" />
        
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          <span className="text-sm font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          onClick={addKeyframe}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <CircleDot size={18} />
          <span className="text-sm font-medium">Add Keyframe</span>
        </button>
        
        <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-lg">
          <Settings size={16} className="text-gray-400" />
          <select 
            value={selectedCurveType}
            onChange={(e) => setCurveType(e.target.value as any)}
            className="bg-transparent text-sm text-gray-200 outline-none cursor-pointer"
          >
            <option value="linear" className="bg-gray-800">Linear</option>
            <option value="easeIn" className="bg-gray-800">Ease In</option>
            <option value="easeOut" className="bg-gray-800">Ease Out</option>
            <option value="easeInOut" className="bg-gray-800">Ease In Out</option>
            <option value="elastic" className="bg-gray-800">Elastic</option>
          </select>
        </div>
      </div>

      <div>
        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 border border-gray-600">
          <Download size={18} />
          <span className="text-sm font-medium">Export Video</span>
        </button>
      </div>
    </div>
  );
}
