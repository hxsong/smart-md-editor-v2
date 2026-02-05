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
- **Export & Deployment**:
  - **PDF Export**: Generate high-quality PDF documents directly from the preview pane.
  - **Automated CI/CD**: Seamless deployment to GitHub Pages via GitHub Actions.
- **Content Intelligence**:
  - **Syntax Validation**: Real-time checking for unclosed code blocks and empty diagrams.
  - **Preview-to-Editor Navigation**: Click or select text in the preview to instantly locate and highlight the source code in the editor.
- **Modern UI/UX**:
  - **Smooth Animations**: Integrated transition effects for a more fluid experience.
  - **Toast Notifications**: Clear feedback for file operations and system status.
  - **Custom Scrollbars**: Consistent and elegant scrolling across all browsers.
- **File System Safety**: 
  - **Automatic Backups**: Creates `.md.bak` files before saving.
  - **Atomic Writes**: Ensures data integrity during file operations.
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
