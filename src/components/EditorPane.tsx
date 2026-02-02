import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { MarkdownPreview } from './MarkdownPreview';
import { Save, LogOut } from 'lucide-react';

interface EditorPaneProps {
  content: string;
  previewContent: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onExitEdit: () => void;
  fileName: string;
}

export const EditorPane: React.FC<EditorPaneProps> = ({ content, previewContent, onChange, onSave, onExitEdit, fileName }) => {
  const editorRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef<'editor' | 'preview' | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add Keybinding for Save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Sync Scroll: Editor -> Preview
    editor.onDidScrollChange(() => {
      if (isScrolling.current === 'preview') return;
      
      isScrolling.current = 'editor';
      
      if (previewRef.current) {
        const visibleRange = editor.getVisibleRanges()[0];
        if (visibleRange) {
           const lineNumber = visibleRange.startLineNumber;
           // Find closest element with data-line
           const elements = Array.from(previewRef.current.querySelectorAll('[data-line]'));
           
           let targetElement = null;
           let minDiff = Infinity;
           
           for (const el of elements) {
             const line = parseInt(el.getAttribute('data-line') || '0', 10);
             // Match Monaco 1-based line to Markdown-it 0-based line
             const diff = Math.abs(line - (lineNumber - 1));
             
             if (diff < minDiff) {
               minDiff = diff;
               targetElement = el;
             }
           }
           
           if (targetElement && minDiff < 50) { // Only sync if reasonably close
             // Calculate offset to scroll
             const el = targetElement as HTMLElement;
             // We use offsetTop. Note: this assumes previewRef.current is the offsetParent
             // If there are nested positioned elements, this might need adjustment.
             // But usually markdown-body is just a flow container.
             previewRef.current.scrollTop = el.offsetTop - 10; // 10px padding
           } else {
             // Fallback to percentage
             const editorScrollHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
             const editorScrollTop = editor.getScrollTop();
             const percentage = editorScrollTop / editorScrollHeight;
             
             const previewScrollHeight = previewRef.current.scrollHeight - previewRef.current.clientHeight;
             previewRef.current.scrollTop = percentage * previewScrollHeight;
           }
        }
      }
      
      // Debounce reset scrolling lock
      setTimeout(() => { isScrolling.current = null; }, 100);
    });
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrolling.current === 'editor') return;
    
    isScrolling.current = 'preview';
    if (editorRef.current) {
      const target = e.target as HTMLDivElement;
      const previewScrollHeight = target.scrollHeight - target.clientHeight;
      const previewScrollTop = target.scrollTop;
      const percentage = previewScrollTop / previewScrollHeight;
      
      const editor = editorRef.current;
      const editorScrollHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
      editor.setScrollTop(percentage * editorScrollHeight);
    }
    
    setTimeout(() => { isScrolling.current = null; }, 100);
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 bg-white dark:bg-slate-900 justify-between">
        <div className="flex items-center gap-4">
            <span className="font-semibold text-lg text-slate-800 dark:text-slate-200 truncate">
            {fileName}
            </span>
            <button
            onClick={onSave}
            className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
            <Save size={16} />
            Save
            </button>
        </div>
        
        <button
          onClick={onExitEdit}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium"
        >
          <LogOut size={16} />
          Exit Edit
        </button>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area (1/3) */}
        <div className="h-full border-r border-slate-200 dark:border-slate-700 flex-1 min-w-0">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={content}
            onChange={(val) => onChange(val || '')}
            theme="vs-dark" 
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        
        {/* Preview Area (2/3) */}
        <div className="h-full bg-white dark:bg-slate-800 flex-[2] min-w-0">
          <MarkdownPreview
            content={previewContent || content}
            previewRef={previewRef}
            onScroll={handlePreviewScroll}
          />
        </div>
      </div>
    </div>
  );
};
