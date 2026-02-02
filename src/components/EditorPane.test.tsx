import { render, fireEvent, act } from '@testing-library/react';
import { EditorPane } from '../EditorPane';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Monaco Editor
const mockEditor = {
  getScrollHeight: vi.fn(() => 1000),
  getLayoutInfo: vi.fn(() => ({ height: 500 })),
  setScrollTop: vi.fn(),
  updateOptions: vi.fn(),
  getModel: vi.fn(),
  getVisibleRanges: vi.fn(() => [{ startLineNumber: 1, endLineNumber: 10 }]),
  revealRangeInCenter: vi.fn(),
  setSelection: vi.fn(),
  deltaDecorations: vi.fn(() => []),
  addCommand: vi.fn(),
};

const mockModel = {
  findMatches: vi.fn(),
};

vi.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ onMount }: any) => {
    // Simulate mount
    React.useEffect(() => {
      onMount(mockEditor, { KeyMod: { CtrlCmd: 0 }, KeyCode: { KeyS: 0 } });
    }, []);
    return <div data-testid="mock-editor">Editor</div>;
  },
}));

// Mock MarkdownPreview
vi.mock('./MarkdownPreview', () => ({
  MarkdownPreview: ({ onScroll, onMouseUp, onKeyUp, previewRef }: any) => (
    <div
      data-testid="mock-preview"
      ref={previewRef}
      onScroll={onScroll}
      onMouseUp={onMouseUp}
      onKeyUp={onKeyUp}
      style={{ overflowY: 'auto', height: '500px' }}
    >
      <div style={{ height: '1000px' }}>Content</div>
    </div>
  ),
}));

import React from 'react';

describe('EditorPane Scroll Sync & Text Highlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditor.getModel.mockReturnValue(mockModel);
  });

  it('syncs scroll from preview to editor', () => {
    const { getByTestId } = render(
      <EditorPane
        content="test"
        previewContent="test"
        onChange={() => {}}
        onSave={() => {}}
        onExitEdit={() => {}}
        fileName="test.md"
      />
    );

    const preview = getByTestId('mock-preview');
    
    // Mock scroll properties
    Object.defineProperty(preview, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(preview, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(preview, 'scrollTop', { value: 250, configurable: true });

    fireEvent.scroll(preview);

    // 250 / (1000 - 500) = 0.5 (50%)
    // Editor scroll height 1000 - 500 = 500
    // Expected setScrollTop = 0.5 * 500 = 250
    expect(mockEditor.setScrollTop).toHaveBeenCalledWith(250);
  });

  it('highlights text in editor on selection in preview', () => {
    const { getByTestId } = render(
      <EditorPane
        content="test"
        previewContent="test"
        onChange={() => {}}
        onSave={() => {}}
        onExitEdit={() => {}}
        fileName="test.md"
      />
    );

    const preview = getByTestId('mock-preview');

    // Mock window.getSelection
    const mockSelection = {
      toString: () => 'target text',
    };
    Object.defineProperty(window, 'getSelection', {
      value: () => mockSelection,
      writable: true,
    });

    // Mock matches
    mockModel.findMatches.mockReturnValue([
      { range: { startLineNumber: 5, endLineNumber: 5, startColumn: 1, endColumn: 10 } },
    ]);

    fireEvent.mouseUp(preview);

    expect(mockModel.findMatches).toHaveBeenCalledWith('target text', false, false, true, null, true);
    expect(mockEditor.revealRangeInCenter).toHaveBeenCalled();
    expect(mockEditor.setSelection).toHaveBeenCalled();
    expect(mockEditor.deltaDecorations).toHaveBeenCalled();
  });

  it('disables editor scroll when preview is scrollable', () => {
    render(
      <EditorPane
        content="test"
        previewContent="test"
        onChange={() => {}}
        onSave={() => {}}
        onExitEdit={() => {}}
        fileName="test.md"
      />
    );

    // Since our mock preview has height 1000 > 500, it is scrollable
    // The useEffect should run and updateOptions
    expect(mockEditor.updateOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        scrollbar: expect.objectContaining({
          handleMouseWheel: false,
        }),
      })
    );
  });
});
