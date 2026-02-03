import React, { useRef, useCallback } from 'react';
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
  const lastValueRef = useRef<string>(content);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
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

  const handleEditorScroll = () => {
    if (editorRef.current && previewRef.current) {
      const editor = editorRef.current;
      const preview = previewRef.current;
      
      const editorScrollTop = editor.getScrollTop();
      const editorScrollHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
      
      if (editorScrollHeight > 0) {
        const percentage = editorScrollTop / editorScrollHeight;
        const previewScrollHeight = preview.scrollHeight - preview.clientHeight;
        preview.scrollTop = percentage * previewScrollHeight;
      }
    }
  };

  // Add scroll listener to editor
  React.useEffect(() => {
    if (editorRef.current) {
      const disposable = editorRef.current.onDidScrollChange(() => {
        handleEditorScroll();
      });
      return () => disposable.dispose();
    }
  }, [editorRef.current]);

  const performSearchAndHighlight = (text: string, sentence?: string, heading?: string, lineHint?: number) => {
     if (!text || !editorRef.current) return;
     
     const editor = editorRef.current;
     const model = editor.getModel();
     if (!model) return;

     const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     
     let startLine = 1;
     let endLine = model.getLineCount();

     // 1. Use heading to narrow down the range
     if (heading) {
       const headingMatches = model.findMatches(escapeRegExp(heading), false, false, false, null, true);
       if (headingMatches.length > 0) {
         startLine = headingMatches[0].range.startLineNumber;
        // Try to find the next heading to define the end of the range
        const nextHeadingMatches = model.findMatches('^#+\\s+', true, true, false, null, true);
        const nextHeading = nextHeadingMatches.find((m: any) => m.range.startLineNumber > startLine);
        if (nextHeading) {
          endLine = nextHeading.range.startLineNumber;
        }
       }
     }

     // 2. If we have a lineHint from data-line, and it's within our heading range, use it to narrow further
     if (lineHint !== undefined && lineHint !== -1) {
       const adjustedLine = lineHint + 1; // data-line is 0-indexed, monaco is 1-indexed
       if (adjustedLine >= startLine && adjustedLine <= endLine) {
         startLine = adjustedLine;
       }
     }

     const rangeToSearch = {
       startLineNumber: startLine,
       startColumn: 1,
       endLineNumber: endLine,
       endColumn: model.getLineMaxColumn(endLine)
     };

     // 3. Try to find the sentence within the range
     let bestMatch = null;
     if (sentence && sentence.length > 5) {
       const sentenceMatches = model.findMatches(escapeRegExp(sentence), rangeToSearch, false, false, null, true);
       if (sentenceMatches.length > 0) {
         bestMatch = sentenceMatches[0];
       }
     }

     // 4. If sentence not found, search for the text within the range
     if (!bestMatch) {
       const matches = model.findMatches(escapeRegExp(text), rangeToSearch, false, false, null, true);
       if (matches.length > 0) {
         bestMatch = matches[0];
       }
     }

     // 5. Fallback: if not found in range, search entire document
     if (!bestMatch) {
       const matches = model.findMatches(escapeRegExp(text), false, false, false, null, true);
       if (matches.length > 0) {
         // Closest to center
         const visibleRanges = editor.getVisibleRanges();
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
         } else {
           bestMatch = matches[0];
         }
       }
     }

     if (bestMatch) {
       editor.revealRangeInCenter(bestMatch.range);
       editor.setSelection(bestMatch.range);
       
       const newDecorations = [
         {
           range: bestMatch.range,
           options: {
             isWholeLine: false,
             className: 'text-highlight-bg',
             inlineClassName: 'text-highlight-text',
             hoverMessage: { value: '从预览区域匹配' }
           }
         }
       ];
       
       highlightDecorations.current = editor.deltaDecorations(highlightDecorations.current, newDecorations);
       
       setTimeout(() => {
         if (editorRef.current) {
           highlightDecorations.current = editorRef.current.deltaDecorations(highlightDecorations.current, []);
         }
       }, 1500);
     }
   };

   const getContextInfo = (range: Range | null) => {
     if (!range) return { sentence: '', heading: '', lineHint: -1 };
     
     const container = range.startContainer;
     const offset = range.startOffset;
     
     // 1. Get Sentence
     let sentence = '';
     if (container.nodeType === Node.TEXT_NODE) {
       const content = container.textContent || '';
       let start = offset;
       while (start > 0 && !/[。？！.!?\n]/.test(content[start - 1])) start--;
       let end = offset;
       while (end < content.length && !/[。？！.!?\n]/.test(content[end])) end++;
       sentence = content.substring(start, end).trim();
     }

     // 2. Get Heading and Line Hint
     let heading = '';
     let lineHint = -1;
     let el: Element | null = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : container.parentElement;
     
     // Find nearest parent with data-line
     let currForLine: Element | null = el;
     while (currForLine && !currForLine.hasAttribute('data-line')) {
       currForLine = currForLine.parentElement;
       if (currForLine && currForLine.classList.contains('prose')) break;
     }
     if (currForLine && currForLine.hasAttribute('data-line')) {
       lineHint = parseInt(currForLine.getAttribute('data-line') || '-1', 10);
     }

     // Find nearest preceding heading
     const allElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, li, pre, .mermaid-container'));
     
     let searchStartEl = el;
     while (searchStartEl && !allElements.includes(searchStartEl)) {
       searchStartEl = searchStartEl.parentElement;
     }
     
     const myIndex = searchStartEl ? allElements.indexOf(searchStartEl) : -1;
     
     if (myIndex !== -1) {
       for (let i = myIndex; i >= 0; i--) {
         const el = allElements[i];
         if (/^H[1-6]$/i.test(el.tagName)) {
           heading = el.textContent?.trim() || '';
           break;
         }
       }
     }

     return { sentence, heading, lineHint };
   };

   const handleTextSelection = () => {
     const selection = window.getSelection();
     const text = selection?.toString().trim();
     if (text && selection && selection.rangeCount > 0) {
       const { sentence, heading, lineHint } = getContextInfo(selection.getRangeAt(0));
       performSearchAndHighlight(text, sentence, heading, lineHint);
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
           performSearchAndHighlight(word, sentence, heading, lineHint);
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
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontFamily: '"Fira Code", monospace',
          fontSize: 13,
          stablePeek: true,
          // 禁用自动补全和提示
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          tabCompletion: 'off',
          parameterHints: { enabled: false },
          snippetSuggestions: 'none',
          wordBasedSuggestions: 'off',
          suggest: {
            showWords: false,
            showSnippets: false,
          },
          // 禁用自动闭合和自动环绕
          autoClosingBrackets: 'never',
          autoClosingQuotes: 'never',
          autoClosingOvertype: 'never',
          autoSurround: 'never',
          // 禁用键入时格式化
          formatOnType: false,
          formatOnPaste: false,
          // 禁用可能干扰输入的其他功能
          dragAndDrop: false,
          links: false,
          occurrencesHighlight: 'off',
          selectionHighlight: false,
          // 优化中文输入体验
          unicodeHighlight: {
            ambiguousCharacters: false,
            invisibleCharacters: false,
          },
          // 保持稳定性
          scrollBeyondLastColumn: 0,
          overviewRulerLanes: 0,
        }}
      />
    ), [fileName, handleEditorDidMount]); // Only re-create if fileName or mount handler changes

  return (
    <div className="flex h-full w-full flex-col bg-secondary-50 dark:bg-secondary-900">
      {/* Toolbar */}
      <div className="h-14 flex items-center px-4 bg-white dark:bg-secondary-900 justify-between z-10 border-b border-secondary-100 dark:border-secondary-800">
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
            保存
            </button>
        </div>
        
        <button
          onClick={onExitEdit}
          className="h-8 flex items-center gap-1.5 bg-white dark:bg-secondary-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary-600 dark:text-secondary-300 hover:text-red-600 dark:hover:text-red-400 border border-secondary-200 dark:border-secondary-700 hover:border-red-200 dark:hover:border-red-800 px-4 rounded transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          退出
        </button>
      </div>

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
