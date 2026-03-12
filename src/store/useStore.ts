import { create } from 'zustand';
import { getInterpolatedValue } from '../utils/animation';

export interface Keyframe {
  id: string;
  time: number;
  value: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'elastic';
}

interface AppState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  keyframes: Keyframe[];
  selectedCurveType: Keyframe['easing'];
  pixelsPerMs: number;

  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurveType: (type: Keyframe['easing']) => void;
  setPixelsPerMs: (pixelsPerMs: number) => void;
  addKeyframe: () => void;
  updateKeyframe: (id: string, updates: Partial<Keyframe>) => void;
}

const MIN_PIXELS_PER_MS = 0.03;
const MAX_PIXELS_PER_MS = 2;

export const useStore = create<AppState>((set, get) => ({
  currentTime: 0,
  duration: 5000,
  isPlaying: false,
  keyframes: [],
  selectedCurveType: 'linear',
  pixelsPerMs: 0.12,

  setCurrentTime: (time) => set({ currentTime: Math.max(0, Math.min(time, get().duration)) }),
  setDuration: (duration) => set((state) => ({
    duration,
    currentTime: Math.min(state.currentTime, duration),
    keyframes: state.keyframes
      .map((keyframe) => ({ ...keyframe, time: Math.min(keyframe.time, duration) }))
      .sort((a, b) => a.time - b.time),
  })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurveType: (type) => set({ selectedCurveType: type }),
  setPixelsPerMs: (pixelsPerMs) => set({
    pixelsPerMs: Math.max(MIN_PIXELS_PER_MS, Math.min(pixelsPerMs, MAX_PIXELS_PER_MS)),
  }),

  addKeyframe: () => {
    const { currentTime, keyframes, selectedCurveType } = get();
    const defaultValue = getInterpolatedValue(keyframes, currentTime) ?? 0;

    const newKeyframe: Keyframe = {
      id: Math.random().toString(36).substring(7),
      time: currentTime,
      value: defaultValue,
      easing: selectedCurveType,
    };

    const existingIndex = keyframes.findIndex((kf) => Math.abs(kf.time - currentTime) < 1);
    let updatedKeyframes: Keyframe[];

    if (existingIndex >= 0) {
      updatedKeyframes = [...keyframes];
      updatedKeyframes[existingIndex] = {
        ...updatedKeyframes[existingIndex],
        value: newKeyframe.value,
        easing: newKeyframe.easing,
      };
    } else {
      updatedKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    }

    set({ keyframes: updatedKeyframes });
  },

  updateKeyframe: (id, updates) => {
    const duration = get().duration;

    set((state) => ({
      keyframes: state.keyframes
        .map((kf) => {
          if (kf.id !== id) {
            return kf;
          }

          return {
            ...kf,
            ...updates,
            time: updates.time === undefined ? kf.time : Math.max(0, Math.min(updates.time, duration)),
          };
        })
        .sort((a, b) => a.time - b.time),
    }));
  },
}));
