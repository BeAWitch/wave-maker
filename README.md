# WaveMaker - Custom Waveform Animation App

WaveMaker is an interactive web-based animation tool that allows users to create custom animations of a moving dot along a path defined by keyframes and easing curves.

## 🎯 Features

- **Interactive Canvas**: An 800x600 graphical display area for manipulating keyframes.
- **Timeline Control**: A draggable timeline at the bottom to scrub through time and view the current playback position.
- **Keyframe Management**: 
  - Click "Add Keyframe" to create a new keyframe at the current time.
  - Each keyframe stores its X/Y position, time, and the easing curve type leading up to it.
  - Drag keyframes around the canvas to change their spatial position.
  - A ghost marker (semi-transparent dot) is left behind at the keyframe's initial position for reference.
- **Custom Easing Curves**: Choose from various easing functions (Linear, Ease In, Ease Out, Ease In Out, Elastic) for each keyframe to control the acceleration and deceleration of the moving dot.
- **Live Preview**: Play, pause, and scrub through your animation in real-time. The moving dot (red) will traverse the path according to your keyframes.
- **Video Export (Pending)**: Export the resulting animation as a video file (WebM / MP4).

## 🛠 Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Graphics & Rendering**: react-konva (Canvas 2D)
- **Icons**: lucide-react

## 🚀 Execution Plan

This project is being developed in 5 main stages:

### Stage 1: Project Initialization & Static Layout (Completed)
- Set up Vite + React + TS project.
- Configure Tailwind CSS.
- Build the classic 3-panel UI: Top Toolbar, Center Canvas, Bottom Timeline.

### Stage 2: State Management & Timeline Interaction (Completed)
- Implement global store using Zustand (`currentTime`, `keyframes`, `playback` state).
- Create a draggable timeline that updates the global time.
- Implement the "Add Keyframe" logic to capture time and curve settings.

### Stage 3: Canvas Interaction & Rendering (Completed)
- Integrate `react-konva`.
- Render draggable keyframes on the canvas.
- Display "ghost dots" at the initial creation coordinates of moved keyframes.

### Stage 4: Animation Engine (Completed)
- Build a custom animation loop using `requestAnimationFrame`.
- Implement mathematical interpolation and easing functions to calculate the moving dot's real-time position.
- Render the moving dot and connect keyframes with visual paths.

### Stage 5: Video Export (Pending)
- Implement canvas stream capturing (`canvas.captureStream()`).
- Use `MediaRecorder` to record the animation loop.
- Provide export options for WebM (native) and MP4 (via `ffmpeg.wasm`).

## 📦 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
