# Smart MD Editor

A modern, dual-pane Markdown editor with intelligent features.

## Key Features

- **Intelligent Dual-Pane Interface**: Edit Markdown on the left, see live preview on the right with synchronized scrolling.
- **Advanced Markdown Support**: 
  - **Math Formulas**: Deep integration with KaTeX for LaTeX-style math rendering.
  - **Extended Syntax**: Support for footnotes, task lists, and automatic Table of Contents (TOC).
- **Rich Diagram Integration**: 
  - **Mermaid & PlantUML**: Render flowcharts, sequence diagrams, and more directly from code.
  - **ECharts**: Embed interactive data visualizations using JSON configuration.
- **Preview-to-Editor Navigation**: 
  - Click or select text in the preview to instantly locate and highlight the source code in the editor.
- **Interactive Tables**: Clickable headers for table sorting and responsive scroll views.
- **File System Safety**: 
  - **Automatic Backups**: Creates `.md.bak` files before saving.
  - **Atomic Writes**: Ensures data integrity during file operations.
  - **Legacy Fallback**: Automatic download fallback for browsers without File System Access API support.
- **Optimized Editing**: 
  - **Monaco Editor**: High-performance editing experience with shortcuts (Ctrl/Cmd+S).
  - **IME Optimization**: Specifically tuned for smooth Chinese input method (IME) experience.

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
