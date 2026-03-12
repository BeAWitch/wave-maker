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

interface ClipboardKeyframe {
  timeOffset: number;
  value: number;
  curveType: CurveType;
  easingMode: EasingMode;
}

interface AppState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  keyframes: Keyframe[];
  selectedKeyframeIds: string[];
  clipboardKeyframes: ClipboardKeyframe[];
  pixelsPerMs: number;

  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSelectedKeyframeIds: (ids: string[]) => void;
  setPixelsPerMs: (pixelsPerMs: number) => void;
  addKeyframe: () => void;
  deleteSelectedKeyframes: () => void;
  copySelectedKeyframes: () => void;
  pasteKeyframesAtCurrentTime: () => void;
  updateSelectedKeyframesCurveType: (curveType: CurveType) => void;
  updateSelectedKeyframesEasingMode: (easingMode: EasingMode) => void;
  updateKeyframe: (id: string, updates: Partial<Keyframe>) => void;
  updateKeyframes: (updatesById: Record<string, Partial<Keyframe>>) => void;
}

const MIN_PIXELS_PER_MS = 0.03;
const MAX_PIXELS_PER_MS = 2;

export const useStore = create<AppState>((set, get) => ({
  currentTime: 0,
  duration: 5000,
  isPlaying: false,
  keyframes: [],
  selectedKeyframeIds: [],
  clipboardKeyframes: [],
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
  setSelectedKeyframeIds: (ids) => set({ selectedKeyframeIds: [...new Set(ids)] }),
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
    set({ keyframes: updatedKeyframes, selectedKeyframeIds: [selectedKeyframeId] });
  },

  deleteSelectedKeyframes: () => {
    const { keyframes, selectedKeyframeIds } = get();

    if (selectedKeyframeIds.length === 0) {
      return;
    }

    set({
      keyframes: keyframes.filter((keyframe) => !selectedKeyframeIds.includes(keyframe.id)),
      selectedKeyframeIds: [],
    });
  },

  copySelectedKeyframes: () => {
    const { keyframes, selectedKeyframeIds } = get();
    const selectedKeyframes = keyframes
      .filter((keyframe) => selectedKeyframeIds.includes(keyframe.id))
      .sort((a, b) => a.time - b.time);

    if (selectedKeyframes.length === 0) {
      return;
    }

    const firstTime = selectedKeyframes[0].time;

    set({
      clipboardKeyframes: selectedKeyframes.map((keyframe) => ({
        timeOffset: keyframe.time - firstTime,
        value: keyframe.value,
        curveType: keyframe.curveType,
        easingMode: keyframe.easingMode,
      })),
    });
  },

  pasteKeyframesAtCurrentTime: () => {
    const { clipboardKeyframes, currentTime, duration, keyframes } = get();

    if (clipboardKeyframes.length === 0) {
      return;
    }

    const pastedKeyframes: Keyframe[] = clipboardKeyframes.map((clipboardKeyframe) => ({
      id: Math.random().toString(36).substring(7),
      time: Math.max(0, Math.min(currentTime + clipboardKeyframe.timeOffset, duration)),
      value: clipboardKeyframe.value,
      curveType: clipboardKeyframe.curveType,
      easingMode: clipboardKeyframe.easingMode,
    }));

    set({
      keyframes: [...keyframes, ...pastedKeyframes].sort((a, b) => a.time - b.time),
      selectedKeyframeIds: pastedKeyframes.map((keyframe) => keyframe.id),
    });
  },

  updateSelectedKeyframesCurveType: (curveType) => {
    const { selectedKeyframeIds } = get();

    if (selectedKeyframeIds.length === 0) {
      return;
    }

    const updatesById = Object.fromEntries(selectedKeyframeIds.map((id) => [id, { curveType }]));
    get().updateKeyframes(updatesById);
  },

  updateSelectedKeyframesEasingMode: (easingMode) => {
    const { selectedKeyframeIds } = get();

    if (selectedKeyframeIds.length === 0) {
      return;
    }

    const updatesById = Object.fromEntries(selectedKeyframeIds.map((id) => [id, { easingMode }]));
    get().updateKeyframes(updatesById);
  },

  updateKeyframe: (id, updates) => {
    get().updateKeyframes({ [id]: updates });
  },

  updateKeyframes: (updatesById) => {
    const duration = get().duration;

    set((state) => ({
      keyframes: state.keyframes
        .map((kf) => {
          const updates = updatesById[kf.id];

          if (!updates) {
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
