import { create } from 'zustand';
import { getInterpolatedValue } from '../utils/animation';

export type CurveType = 'linear' | 'quadratic' | 'cubic' | 'bezier';
export type EasingMode = 'easeIn' | 'easeOut' | 'easeInOut';

export interface Keyframe {
  id: string;
  time: number;
  value: number;
  curveType: CurveType;
  easingMode: EasingMode;
}

interface AppState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  keyframes: Keyframe[];
  selectedKeyframeId: string | null;
  pixelsPerMs: number;

  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSelectedKeyframeId: (id: string | null) => void;
  setPixelsPerMs: (pixelsPerMs: number) => void;
  addKeyframe: () => void;
  deleteSelectedKeyframe: () => void;
  updateSelectedKeyframeCurveType: (curveType: CurveType) => void;
  updateSelectedKeyframeEasingMode: (easingMode: EasingMode) => void;
  updateKeyframe: (id: string, updates: Partial<Keyframe>) => void;
}

const MIN_PIXELS_PER_MS = 0.03;
const MAX_PIXELS_PER_MS = 2;

export const useStore = create<AppState>((set, get) => ({
  currentTime: 0,
  duration: 5000,
  isPlaying: false,
  keyframes: [],
  selectedKeyframeId: null,
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
  setSelectedKeyframeId: (id) => set({ selectedKeyframeId: id }),
  setPixelsPerMs: (pixelsPerMs) => set({
    pixelsPerMs: Math.max(MIN_PIXELS_PER_MS, Math.min(pixelsPerMs, MAX_PIXELS_PER_MS)),
  }),

  addKeyframe: () => {
    const { currentTime, keyframes } = get();
    const defaultValue = getInterpolatedValue(keyframes, currentTime) ?? 0;

    const newKeyframe: Keyframe = {
      id: Math.random().toString(36).substring(7),
      time: currentTime,
      value: defaultValue,
      curveType: 'linear',
      easingMode: 'easeInOut',
    };

    const existingIndex = keyframes.findIndex((kf) => Math.abs(kf.time - currentTime) < 1);
    let updatedKeyframes: Keyframe[];

    if (existingIndex >= 0) {
      updatedKeyframes = [...keyframes];
      updatedKeyframes[existingIndex] = {
        ...updatedKeyframes[existingIndex],
        value: newKeyframe.value,
      };
    } else {
      updatedKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    }

    const selectedKeyframeId = existingIndex >= 0 ? keyframes[existingIndex].id : newKeyframe.id;
    set({ keyframes: updatedKeyframes, selectedKeyframeId });
  },

  deleteSelectedKeyframe: () => {
    const { keyframes, selectedKeyframeId } = get();

    if (!selectedKeyframeId) {
      return;
    }

    set({
      keyframes: keyframes.filter((keyframe) => keyframe.id !== selectedKeyframeId),
      selectedKeyframeId: null,
    });
  },

  updateSelectedKeyframeCurveType: (curveType) => {
    const { selectedKeyframeId } = get();

    if (!selectedKeyframeId) {
      return;
    }

    get().updateKeyframe(selectedKeyframeId, { curveType });
  },

  updateSelectedKeyframeEasingMode: (easingMode) => {
    const { selectedKeyframeId } = get();

    if (!selectedKeyframeId) {
      return;
    }

    get().updateKeyframe(selectedKeyframeId, { easingMode });
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
