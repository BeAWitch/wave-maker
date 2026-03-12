import { Palette } from 'lucide-react';
import { useStore, type DotShape } from '../store/useStore';
import { ColorPickerPopover } from './ColorPickerPopover';

export function StyleSettings() {
  const {
    curveColor,
    curveOpacity,
    dotColor,
    dotOpacity,
    dotShape,
    dotSize,
    setCurveColor,
    setCurveOpacity,
    setDotColor,
    setDotOpacity,
    setDotShape,
    setDotSize,
  } = useStore();

  return (
    <div className="flex items-center gap-4 border-l border-zinc-800 pl-4 ml-4">
      <div className="flex items-center gap-2">
        <Palette size={14} className="text-zinc-500" />
        <span className="text-xs font-medium text-zinc-400">Curve:</span>
        <ColorPickerPopover
          color={curveColor}
          opacity={curveOpacity}
          onChange={(color, opacity) => {
            setCurveColor(color);
            setCurveOpacity(opacity);
          }}
          label="Curve Color"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-400">Dot:</span>
        <ColorPickerPopover
          color={dotColor}
          opacity={dotOpacity}
          onChange={(color, opacity) => {
            setDotColor(color);
            setDotOpacity(opacity);
          }}
          label="Dot Color"
        />
        <select
          value={dotShape}
          onChange={(e) => setDotShape(e.target.value as DotShape)}
          className="bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 px-2 py-0.5 rounded outline-none focus:border-blue-500 transition-colors cursor-pointer w-24"
        >
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
        </select>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={dotSize}
            onChange={(e) => setDotSize(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 px-2 py-0.5 rounded outline-none focus:border-blue-500 w-16"
            min="2"
            max="50"
          />
        </div>
      </div>
    </div>
  );
}
