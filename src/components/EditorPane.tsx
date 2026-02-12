import React, { useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { MarkdownPreview } from './MarkdownPreview';
import { EditorToolbar } from './editor/EditorToolbar';
import { EDITOR_OPTIONS } from './editor/editor-constants';
import { DraggableModal } from './common/DraggableModal';
import { Edit3 } from 'lucide-react';
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
  fileName: string;
  isOpen: boolean;
}

export const EditorPane: React.FC<EditorPaneProps> = ({ 
  content, 
  previewContent, 
  onChange, 
  onSave, 
  onExitEdit, 
  fileName,
  isOpen
}) => {
  const editorRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const highlightDecorations = useRef<string[]>([]);
  const lastValueRef = useRef<string>(content);
  const isProgrammaticScroll = useRef(false);

  const initialWidth = Math.max(600, window.innerWidth * 0.4);
  const initialPosition = { 
    x: 60, 
    y: (window.innerHeight - 700) / 2 
  };

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
      const model = editor.getModel();
      if (model) {
        editor.executeEdits('external-update', [
          {
            range: model.getFullModelRange(),
            text: content,
            forceMoveMarkers: true,
          },
        ]);
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

    const range = (document as any).caretRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      const container = range.startContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        const textContent = container.textContent || '';
        const offset = range.startOffset;
        
        let start = offset;
        while (start > 0 && /\S/.test(textContent[start - 1])) start--;
        let end = offset;
        while (end < textContent.length && /\S/.test(textContent[end])) end++;
        
        const word = textContent.substring(start, end).trim();
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
    <>
      <DraggableModal
        id="editor"
        title={`正在编辑: ${fileName}`}
        isOpen={isOpen}
        onClose={onExitEdit}
        icon={<Edit3 size={18} className="text-primary-600 dark:text-primary-400" />}
        initialPosition={initialPosition}
        initialSize={{ width: initialWidth, height: 700 }}
        minSize={{ width: 500, height: 400 }}
        className="z-[110]"
      >
        <div className="flex h-full w-full flex-col bg-secondary-50 dark:bg-secondary-900 overflow-hidden">
          <EditorToolbar 
            fileName={fileName} 
            onSave={onSave} 
            onExitEdit={onExitEdit} 
          />
          <div className="flex-1 min-w-0 bg-[#1e1e1e] relative overflow-hidden">
            {memoizedEditor}
          </div>
        </div>
      </DraggableModal>

      <div className="h-full bg-white dark:bg-secondary-900 flex-1 min-w-0 relative">
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
    </>
  );
};
