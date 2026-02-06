import React, { useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { MarkdownPreview } from './MarkdownPreview';
import { EditorToolbar } from './editor/EditorToolbar';
import { EDITOR_OPTIONS } from './editor/editor-constants';
import { 
  scrollToPreviewLine, 
  getContextInfo, 
  performSearchAndHighlight 
} from './editor/editor-utils';

interface EditorPaneProps {
  content: string;
  previewContent: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onExitEdit: () => void;
  onExportHTML: () => void;
  fileName: string;
}

export const EditorPane: React.FC<EditorPaneProps> = ({ 
  content, 
  previewContent, 
  onChange, 
  onSave, 
  onExitEdit, 
  onExportHTML,
  fileName 
}) => {
  const editorRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const highlightDecorations = useRef<string[]>([]);
  const lastValueRef = useRef<string>(content);
  const isProgrammaticScroll = useRef(false);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
    // 监听行号点击事件
    editor.onMouseDown((e: any) => {
      const isGutterClick = e.target && (
        e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
        e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
      );

      if (isGutterClick) {
        const lineNumber = e.target.position?.lineNumber;
        const clickY = e.event.browserEvent.clientY;
        if (lineNumber !== undefined) {
          scrollToPreviewLine(lineNumber, clickY, previewRef.current);
        }
      }
    });

    // Add Keybinding for Save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  }, [onSave]);

  // Update editor value only when content prop changes from outside
  React.useEffect(() => {
    if (editorRef.current && content !== lastValueRef.current) {
      const editor = editorRef.current;
      
      // 如果编辑器当前拥有焦点，说明用户正在输入，此时不应强制 setValue，
      // 否则会中断 IME 输入法（如中文输入法）的合成过程，导致闪烁或文字丢失。
      if (editor.hasTextFocus()) {
        return;
      }

      const position = editor.getPosition();
      editor.setValue(content);
      if (position) {
        editor.setPosition(position);
      }
      lastValueRef.current = content;
    }
  }, [content]);

  const handleEditorChange = (val: string | undefined) => {
    const newValue = val || '';
    lastValueRef.current = newValue;
    onChange(newValue);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && selection && selection.rangeCount > 0) {
      const { sentence, heading, lineHint } = getContextInfo(selection.getRangeAt(0));
      performSearchAndHighlight(
        text, 
        editorRef.current, 
        highlightDecorations, 
        isProgrammaticScroll, 
        sentence, 
        heading, 
        lineHint
      );
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      const container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        const content = container.textContent || '';
        const offset = range.startOffset;
        
        let start = offset;
        while (start > 0 && /\S/.test(content[start - 1])) start--;
        let end = offset;
        while (end < content.length && /\S/.test(content[end])) end++;
        
        const word = content.substring(start, end).trim();
        if (word.length > 1) {
          const { sentence, heading, lineHint } = getContextInfo(range);
          performSearchAndHighlight(
            word, 
            editorRef.current, 
            highlightDecorations, 
            isProgrammaticScroll, 
            sentence, 
            heading, 
            lineHint
          );
        }
      }
    }
  };

  // Memoize the Editor to prevent re-renders when previewContent or other props change
  const memoizedEditor = React.useMemo(() => (
    <Editor
      height="100%"
      defaultLanguage="markdown"
      path={fileName}
      defaultValue={content}
      onChange={handleEditorChange}
      theme="vs-dark" 
      onMount={handleEditorDidMount}
      options={EDITOR_OPTIONS}
    />
  ), [fileName, handleEditorDidMount]);

  return (
    <div className="flex h-full w-full flex-col bg-secondary-50 dark:bg-secondary-900">
      <EditorToolbar 
        fileName={fileName} 
        onSave={onSave} 
        onExitEdit={onExitEdit} 
        onExportHTML={onExportHTML}
      />

      {/* Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area (1/3) */}
        <div className="h-full border-r border-secondary-200 dark:border-secondary-700 flex-1 min-w-0 bg-[#1e1e1e]">
          {memoizedEditor}
        </div>
        
        {/* Preview Area (2/3) */}
        <div className="h-full bg-white dark:bg-secondary-900 flex-[2] min-w-0 relative">
          <div className="absolute inset-0 overflow-hidden">
             <MarkdownPreview
                content={previewContent || content}
                previewRef={previewRef}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                onClick={handlePreviewClick}
                className="h-full"
             />
          </div>
        </div>
      </div>
    </div>
  );
};
