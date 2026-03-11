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
  addKeyframe: () => void;
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
  
  addKeyframe: () => {
    const { currentTime, keyframes, selectedCurveType } = get();
    // In future iterations, we'll calculate position based on current time
    const newKeyframe: Keyframe = {
      id: Math.random().toString(36).substring(7),
      time: currentTime,
      x: 400, // Center of 800x600 canvas
      y: 300,
      initialX: 400,
      initialY: 300,
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
