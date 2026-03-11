import { Spline } from 'lucide-react';

export function Header() {
  return (
    <div className="flex items-center px-6 py-3 bg-zinc-900 text-zinc-100 border-b border-zinc-800 shadow-sm z-20 shrink-0">
      <div className="flex items-center gap-2">
        <Spline className="text-blue-500" size={24} />
        <h1 className="text-lg font-semibold tracking-wide text-zinc-100">
          WaveMaker
        </h1>
      </div>
    </div>
  );
}
