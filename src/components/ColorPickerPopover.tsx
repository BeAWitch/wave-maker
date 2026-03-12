import { useState, useRef, useEffect } from 'react';
import { RgbaColorPicker, type RgbaColor } from 'react-colorful';

interface ColorPickerPopoverProps {
  color: string;
  opacity: number;
  onChange: (color: string, opacity: number) => void;
  label: string;
}

function hexToRgba(hex: string, alpha: number): RgbaColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: alpha,
      }
    : { r: 255, g: 255, b: 255, a: alpha };
}

function rgbaToHex({ r, g, b }: RgbaColor): string {
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ColorPickerPopover({ color, opacity, onChange, label }: ColorPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const rgbaColor = hexToRgba(color, opacity);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleChange = (newColor: RgbaColor) => {
    onChange(rgbaToHex(newColor), newColor.a);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 rounded cursor-pointer border border-zinc-700 p-0 flex items-center justify-center bg-zinc-900 checkerboard-bg relative overflow-hidden"
        title={label}
        style={{
          backgroundImage: 'conic-gradient(#3f3f46 25%, transparent 25%), conic-gradient(transparent 75%, #3f3f46 75%)',
          backgroundSize: '8px 8px',
          backgroundPosition: '0 0, 4px 4px'
        }}
      >
        <div 
          className="absolute inset-0 w-full h-full" 
          style={{ backgroundColor: color, opacity: opacity }}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 p-3 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl custom-color-picker">
          <RgbaColorPicker color={rgbaColor} onChange={handleChange} />
        </div>
      )}
    </div>
  );
}
