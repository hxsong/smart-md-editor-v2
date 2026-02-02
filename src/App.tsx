import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { useFileSystem } from './hooks/useFileSystem';
import { FileExplorer } from './components/FileExplorer';
import { EditorPane } from './components/EditorPane';
import { MarkdownPreview } from './components/MarkdownPreview';
import { FolderOpen, Edit3, FileText } from 'lucide-react';
import { validateContent } from './utils/validation';

function App() {
  const {
    openDirectory,
    fileList,
    currentFile,
    setCurrentFile,
    readFile,
    saveFile,
    rootHandle
  } = useFileSystem();

  const [content, setContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const debouncedUpdatePreview = useMemo(
    () => debounce((val: string) => setPreviewContent(val), 200),
    []
  );

  const handleEditorChange = (value: string) => {
    setContent(value);
    debouncedUpdatePreview(value);
  };

  useEffect(() => {
    if (currentFile) {
      console.log('Loading file:', currentFile.name);
      readFile(currentFile)
        .then(text => {
          console.log('File loaded, length:', text.length);
          setContent(text);
          setPreviewContent(text);
        })
        .catch(err => {
          console.error('Error reading file:', err);
          showToast('Failed to read file: ' + err.message, 'error');
        });
    } else {
      setContent('');
      setPreviewContent('');
    }
  }, [currentFile, readFile]);

  const handleSave = async () => {
    if (!currentFile) return;

    // Validation
    const error = validateContent(content);
    if (error) {
      showToast(error, 'error');
      return;
    }

    try {
      await saveFile(currentFile, content);
      showToast('File saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save file.', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="h-screen w-screen flex bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className={`border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-950 transition-all duration-300 ease-in-out ${isEditing ? 'w-0 border-none overflow-hidden' : 'w-64'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="font-bold text-lg">MD Editor</span>
          <button
            onClick={openDirectory}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
            title="Open Folder"
          >
            <FolderOpen size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {rootHandle ? (
            <FileExplorer
              fileList={fileList}
              onFileClick={(node) => {
                setCurrentFile(node);
                setIsEditing(false); // Default to read mode
              }}
              currentFileId={currentFile?.id}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <FolderOpen size={48} className="mb-4 opacity-50" />
              <p className="text-sm">Click the folder icon to open a directory</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {currentFile ? (
          <>
            {/* Header/Toolbar */}
            {!isEditing && (
               <div className="h-14 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 bg-white dark:bg-slate-900">
                 <div className="flex items-center gap-2">
                   <FileText size={20} className="text-blue-500" />
                   <h1 className="font-semibold text-lg truncate">{currentFile.name}</h1>
                 </div>
                 
                 <button
                   onClick={() => setIsEditing(true)}
                   className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                 >
                   <Edit3 size={16} />
                   Edit
                 </button>
               </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
              {isEditing ? (
                <div className="h-full flex flex-col">
                  <EditorPane
                    content={content}
                    previewContent={previewContent}
                    onChange={handleEditorChange}
                    onSave={handleSave}
                    onExitEdit={() => setIsEditing(false)}
                    fileName={currentFile.name}
                  />
                </div>
              ) : (
                <MarkdownPreview content={previewContent || content} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={48} />
            </div>
            <p className="text-xl font-medium">Select a file to view or edit</p>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className={`absolute bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
