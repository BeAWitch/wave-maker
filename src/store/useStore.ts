import { create } from 'zustand';

interface Keyframe {
  id: string;
  time: number;
  x: number;
  y: number;
  initialX: number;
  initialY: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'elastic';
}

interface AppState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  keyframes: Keyframe[];
  selectedCurveType: Keyframe['easing'];

  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurveType: (type: Keyframe['easing']) => void;
  addKeyframe: (x?: number, y?: number) => void;
  updateKeyframe: (id: string, updates: Partial<Keyframe>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentTime: 0,
  duration: 5000, // Default duration 5 seconds
  isPlaying: false,
  keyframes: [],
  selectedCurveType: 'linear',

  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurveType: (type) => set({ selectedCurveType: type }),
  
  addKeyframe: (x, y) => {
    const { currentTime, keyframes, selectedCurveType } = get();
    
    // Default to center of screen roughly if not provided (now with fixed 600px height context)
    const defaultX = x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
    const defaultY = y ?? 300; // Center of 600px fixed height

    const newKeyframe: Keyframe = {
      id: Math.random().toString(36).substring(7),
      time: currentTime,
      x: defaultX,
      y: defaultY,
      initialX: defaultX,
      initialY: defaultY,
      easing: selectedCurveType,
    };
    
    // Add and sort by time
    const updatedKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    set({ keyframes: updatedKeyframes });
  },

  updateKeyframe: (id, updates) => {
    set((state) => ({
      keyframes: state.keyframes.map((kf) => (kf.id === id ? { ...kf, ...updates } : kf)),
    }));
  },
}));
