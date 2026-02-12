# Smart MD Editor

A modern, dual-pane Markdown editor with intelligent features.

## Key Features

- **Intelligent Dual-Pane Interface**: Edit Markdown on the left, see live preview on the right with synchronized scrolling.
- **Advanced Markdown Support**: 
  - **Math Formulas**: Deep integration with KaTeX for LaTeX-style math rendering.
  - **Extended Syntax**: Support for footnotes, task lists, and automatic Table of Contents (TOC).
- **Rich Diagram Integration**: 
  - **Mermaid & PlantUML**: Render flowcharts, sequence diagrams, and more with **Pan & Zoom (2.0)** and **render caching**.
  - **ECharts**: Embed interactive data visualizations with **ResizeObserver** for responsive layouts.
- **Export & Deployment**:
  - **Offline HTML Export**: Generate self-contained HTML documents with **Base64 image localization** and theme-awareness.
  - **PDF Export**: Generate high-quality PDF documents directly from the preview pane.
  - **Automated CI/CD**: Seamless deployment to GitHub Pages via GitHub Actions.
- **Content Intelligence**:
  - **Chinese-Friendly Navigation**: Optimized Slug generation for TOC and anchors supporting Chinese characters.
  - **Syntax Validation**: Integrated checking for **unclosed code blocks** and **empty Mermaid diagrams** before saving.
  - **Preview-to-Editor Navigation**: Click or select text in the preview to instantly locate and highlight the source code in the editor.
- **Modern UI/UX**: 
  - **Dark Mode 2.0**: Deeply optimized color palette for low-light environments across all components.
  - **Unified Feedback System**: Centralized **Progress Modals** for file saving and HTML exporting with detailed status tracking.
  - **Global Notifications**: Lightweight **Toast system** for immediate feedback on user actions and system errors.
  - **Layout Stability**: Image pre-loading containers to prevent **Layout Shift** during rendering.
  - **Back to Top**: Floating button for quick navigation in long documents.
  - **Smooth Animations**: Integrated transition effects and custom scrollbars for a fluid experience.
  - **Interactive Tables**: Clickable headers for sorting with responsive scroll views.
- **File System Safety**: 
  - **Automatic Backups**: Creates `.md.bak` files before saving.
  - **Atomic Writes**: Ensures data integrity during file operations.
  - **Layout Persistence**: Automatically saves and restores modal positions and sizes via **localStorage**.
- **Optimized Editing**: 
  - **Monaco Editor**: High-performance editing experience with shortcuts (**Ctrl/Cmd+S** to save, **Ctrl/Cmd+E** to toggle edit mode).
  - **IME Optimization**: Specifically tuned for smooth Chinese input method (IME) experience.
  - **Responsive Design**: Mobile-friendly interfaces with bottom-drawer interactions for small screens.
  - **Rendering Stability**: Optimized update algorithm to preserve scroll position and prevent flicker.

## Browser Compatibility

This editor utilizes modern web technologies. For the best experience, please use one of the following browsers:

- **Chrome**: Version 90 or later
- **Edge**: Version 90 or later
- **Safari**: Version 14 or later
- **Firefox**: Version 90 or later

## Development

### Running Locally

```bash
npm install
npm run dev
```

### Testing

```bash
npm test
```
