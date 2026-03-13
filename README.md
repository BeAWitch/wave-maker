# WaveMaker

[English](#english) | [中文](#中文)

---

---

## English

### Description
WaveMaker is a web-based animation tool that allows users to create, visually customize, and export beautiful wave animations with a moving dot as WebM videos. It provides an intuitive UI to tweak various visual parameters in real-time and perfectly replicates the canvas state into a downloadable video file.

### Key Features
*   **Visual Customization**: 
    *   Modify the wave curve's color and opacity.
    *   Customize the moving dot's color, opacity, size, and shape (Circle, Square, Triangle).
*   **Integrated Color Picker**: Uses an advanced color picker with alpha-channel support for seamless color and opacity adjustments.
*   **Real-time Preview**: See your changes immediately on the interactive canvas.
*   **Video Export**: High-quality export of your custom animation directly to a `.webm` video file using a hidden background canvas and `MediaRecorder`.

### Tech Stack
*   **Frontend**: React, TypeScript
*   **State Management**: Zustand
*   **Canvas Rendering**: Konva & React-Konva
*   **Color Picker**: `react-colorful`

### Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run the development server**:
    ```bash
    npm run dev
    ```
3.  Open your browser and navigate to the local server URL to start creating waves!

---

## 中文

### 项目简介
WaveMaker 是一个基于 Web 的动画制作工具，允许用户创建、可视化自定义带有移动点的波形动画，并将其导出为 WebM 格式的视频。它提供了一个直观的用户界面，可以实时调整各种视觉参数，并将画布状态完美呈现并导出为可下载的视频文件。

### 主要功能
*   **视觉自定义**:
    *   修改波形曲线的颜色和透明度（默认颜色为白色）。
    *   自定义移动点的颜色、透明度、大小和形状（支持圆形、正方形和三角形）。
*   **集成颜色选择器**: 使用支持 Alpha 通道（透明度）的高级颜色选择器，实现颜色和透明度的无缝调整。
*   **实时预览**: 在交互式画布上立即查看您的修改效果。
*   **视频导出**: 使用隐藏的背景画布和 `MediaRecorder` 技术，将您的自定义动画导出为 `.webm` 视频文件。

### 技术栈
*   **前端框架**: React, TypeScript
*   **状态管理**: Zustand
*   **画布渲染**: Konva & React-Konva
*   **颜色选择器**: `react-colorful`

### 快速开始

1.  **安装依赖**:
    ```bash
    npm install
    ```
2.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
3.  打开浏览器并访问本地服务器地址，开始制作您的波形动画！
