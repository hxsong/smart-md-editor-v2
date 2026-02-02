import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { MarkdownPreview } from './MarkdownPreview';
import { Save, LogOut, FileText } from 'lucide-react';

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
  const highlightDecorations = useRef<string[]>([]);
  const [_, setIsPreviewScrollable] = React.useState(false);

  // Check if preview is scrollable
  React.useEffect(() => {
    if (previewRef.current) {
      const scrollable = previewRef.current.scrollHeight > previewRef.current.clientHeight;
      setIsPreviewScrollable(scrollable);
      
      // Update editor scroll capability based on preview scrollability
      if (editorRef.current) {
        editorRef.current.updateOptions({
          scrollbar: {
            handleMouseWheel: !scrollable,
            alwaysConsumeMouseWheel: !scrollable
          }
        });
      }
    }
  }, [previewContent]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add Keybinding for Save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Remove the previous scroll listener logic
    // We now rely solely on handlePreviewScroll
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      const target = e.target as HTMLDivElement;
      const previewScrollHeight = target.scrollHeight - target.clientHeight;
      
      // If preview is not scrollable, do nothing (should fallback to editor scroll)
      if (previewScrollHeight <= 0) return;

      const previewScrollTop = target.scrollTop;
      const percentage = previewScrollTop / Math.max(previewScrollHeight, 1);
      
      const editor = editorRef.current;
      const editorScrollHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
      editor.setScrollTop(percentage * editorScrollHeight);
    }
  };

  const performSearchAndHighlight = (text: string) => {
     if (!text || !editorRef.current) return;
     
     const editor = editorRef.current;
     const model = editor.getModel();
     if (!model) return;
 
     // Escape special regex characters
     const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     
     // Find matches
     const matches = model.findMatches(escapedText, false, false, true, null, true);
     
     if (matches.length > 0) {
       // Find the best match (closest to current view)
       const visibleRanges = editor.getVisibleRanges();
       let bestMatch = matches[0];
       
       if (visibleRanges.length > 0) {
         const centerLine = (visibleRanges[0].startLineNumber + visibleRanges[0].endLineNumber) / 2;
         let minDistance = Infinity;
         
         for (const match of matches) {
           const distance = Math.abs(match.range.startLineNumber - centerLine);
           if (distance < minDistance) {
             minDistance = distance;
             bestMatch = match;
           }
         }
       }
       
       // Reveal and highlight
       editor.revealRangeInCenter(bestMatch.range);
       editor.setSelection(bestMatch.range);
       
       // Add custom decoration
       // Use className for background and inlineClassName for foreground text
       const newDecorations = [
         {
           range: bestMatch.range,
           options: {
             isWholeLine: false,
             className: 'text-highlight-bg',
             inlineClassName: 'text-highlight-text',
             hoverMessage: { value: 'Matched from preview' }
           }
         }
       ];
       
       highlightDecorations.current = editor.deltaDecorations(highlightDecorations.current, newDecorations);
       
       // Remove decoration after 1.5s
       setTimeout(() => {
         if (editorRef.current) {
           highlightDecorations.current = editorRef.current.deltaDecorations(highlightDecorations.current, []);
         }
       }, 1500);
     }
   };

   const handleTextSelection = () => {
     const selection = window.getSelection();
     const text = selection?.toString().trim();
     if (text) {
       performSearchAndHighlight(text);
     }
   };

   const handlePreviewClick = (e: React.MouseEvent) => {
     // If there's already a selection, handleTextSelection will take care of it via mouseup
     // We only handle simple clicks here to get the word under cursor
     const selection = window.getSelection();
     if (selection && selection.toString().trim().length > 0) return;

     // Try to get the word at click position
     const range = document.caretRangeFromPoint(e.clientX, e.clientY);
     if (range) {
       const container = range.startContainer;
       if (container.nodeType === Node.TEXT_NODE) {
         const content = container.textContent || '';
         const offset = range.startOffset;
         
         // Find word boundaries
         let start = offset;
         while (start > 0 && /\S/.test(content[start - 1])) start--;
         let end = offset;
         while (end < content.length && /\S/.test(content[end])) end++;
         
         const word = content.substring(start, end).trim();
         if (word.length > 1) { // Avoid single characters or empty strings
           performSearchAndHighlight(word);
         }
       }
     }
   };

  return (
    <div className="flex h-full w-full flex-col bg-secondary-50 dark:bg-secondary-900">
      {/* Toolbar */}
      <div className="h-14 flex items-center px-4 bg-white dark:bg-secondary-900 justify-between z-10">
        <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
            <div className="p-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400">
               <FileText size={18} />
            </div>
            <span className="font-semibold text-lg text-secondary-900 dark:text-secondary-100 truncate">
            {fileName}
            </span>
            <div className="h-4 w-px bg-secondary-200 dark:bg-secondary-700 mx-2" />
            <button
            onClick={onSave}
            className="h-8 flex items-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white px-4 rounded transition-all shadow-sm hover:shadow font-medium"
            >
            <Save size={16} />
            Save
            </button>
        </div>
        
        <button
          onClick={onExitEdit}
          className="h-8 flex items-center gap-1.5 bg-white dark:bg-secondary-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary-600 dark:text-secondary-300 hover:text-red-600 dark:hover:text-red-400 border border-secondary-200 dark:border-secondary-700 hover:border-red-200 dark:hover:border-red-800 px-4 rounded transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          Exit
        </button>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area (1/3) */}
        <div className="h-full border-r border-secondary-200 dark:border-secondary-700 flex-1 min-w-0 bg-[#1e1e1e]">
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
              fontFamily: '"Fira Code", monospace',
              fontSize: 13,
            }}
          />
        </div>
        
        {/* Preview Area (2/3) */}
        <div className="h-full bg-white dark:bg-secondary-900 flex-[2] min-w-0 relative">
          <div className="absolute inset-0 overflow-hidden">
             <MarkdownPreview
                content={previewContent || content}
                previewRef={previewRef}
                onScroll={handlePreviewScroll}
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
