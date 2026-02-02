# Smart MD Editor

A modern, dual-pane Markdown editor with intelligent features.

## Features

- **Dual-Pane Interface**: Edit Markdown on the left, see live preview on the right.
- **Preview-Driven Scrolling**:
  - The scrolling is synchronized from the Preview pane to the Editor pane.
  - While the preview is scrollable, manual scrolling in the editor is disabled to ensure a consistent reading experience.
  - If the preview is too short to scroll, the editor regains manual scroll control.
- **Bidirectional Text Positioning**:
  - Select any text in the Preview pane to instantly locate and highlight the corresponding source code in the Editor.
  - Highlights are displayed with a custom style (#fffbdc background) and fade out automatically after 1.5 seconds.
- **Responsive Design**: Optimized for various screen sizes, including mobile support.

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

Unit tests are located in `src/components/__tests__`.
E2E tests are located in `tests/e2e`.

```bash
npm test
```
