import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { FolderOpen, History } from 'lucide-react';
import { useFileSystem } from './hooks/useFileSystem';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EditorPane } from './components/EditorPane';
import { Changelog } from './components/Changelog';
import { ProgressModal } from './components/common/ProgressModal';
import { generateHTML, saveHTMLFile } from './utils/html-export-utils';
import { md } from './utils/markdown-utils';
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
  
  // Modal States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  
  // HTML Export State
  const [isHTMLProgressModalOpen, setIsHTMLProgressModalOpen] = useState(false);
  const [htmlExportProgress, setHtmlExportProgress] = useState(0);
  const [htmlExportStatus, setHtmlExportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [htmlExportError, setHtmlExportError] = useState('');

  // Save State
  const [isSaveProgressModalOpen, setIsSaveProgressModalOpen] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Global Keyboard Shortcut for Toggle Editor (Ctrl/Cmd + E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (currentFile) {
          setIsEditing(prev => !prev);
        } else {
          showToast('请先选择一个文件进行编辑', 'error');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFile]);

  const debouncedUpdatePreview = useMemo(
    () => debounce((val: string) => setPreviewContent(val), 200),
    []
  );

  const handleEditorChange = useCallback((value: string) => {
    setContent(value);
    debouncedUpdatePreview(value);
  }, [debouncedUpdatePreview]);

  const handleExportHTML = async () => {
    if (!currentFile) return;
    
    setIsHTMLProgressModalOpen(true);
    setHtmlExportStatus('processing');
    setHtmlExportProgress(0);
    setHtmlExportError('');

    try {
      // Use the raw markdown content to generate HTML
      const htmlContent = md.render(content);
      const fullHtml = await generateHTML(htmlContent, {
        title: currentFile.name.replace('.md', ''),
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        onProgress: (p) => setHtmlExportProgress(p)
      });
      
      const fileName = currentFile.name.replace('.md', '.html');
      const success = await saveHTMLFile(fullHtml, fileName);
      
      if (success) {
        setHtmlExportStatus('success');
        setHtmlExportProgress(100);
        showToast('HTML 导出成功！', 'success');
        setTimeout(() => {
          setIsHTMLProgressModalOpen(false);
          setHtmlExportStatus('idle');
        }, 1000);
      } else {
        throw new Error('保存 HTML 文件失败');
      }
    } catch (err: any) {
      console.error(err);
      setHtmlExportStatus('error');
      setHtmlExportError(err.message || '导出过程中发生错误');
      // Auto close after error to allow user to try again
      setTimeout(() => {
        setIsHTMLProgressModalOpen(false);
        setHtmlExportStatus('idle');
      }, 3000);
    }
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
          showToast('读取文件失败: ' + err.message, 'error');
        });
    } else {
      setContent('');
      setPreviewContent('');
      // Open changelog if no file is selected and it's the first load
      const hasSeenChangelog = localStorage.getItem('changelog_last_seen_version');
      if (!hasSeenChangelog) {
        setIsChangelogOpen(true);
      }
    }
  }, [currentFile, readFile]);

  const handleExitEdit = useCallback(async () => {
    setIsEditing(false);
    // Wait for animation or modal close before potentially reverting
    setTimeout(async () => {
      if (currentFile) {
        try {
          const text = await readFile(currentFile);
          setContent(text);
          setPreviewContent(text);
        } catch (err) {
          console.error('Error reverting changes:', err);
        }
      }
    }, 300);
  }, [currentFile, readFile]);

  const handleSave = async () => {
    if (!currentFile) return;

    // Validation
    const error = validateContent(content);
    if (error) {
      showToast(error, 'error');
      return;
    }

    setIsSaveProgressModalOpen(true);
    setSaveStatus('processing');
    setSaveProgress(0);
    setSaveError('');

    try {
      // Simulate progress for visual feedback
      setSaveProgress(20);
      await new Promise(resolve => setTimeout(resolve, 200));
      setSaveProgress(60);
      
      await saveFile(currentFile, content);
      
      setSaveProgress(100);
      setSaveStatus('success');
      showToast('文件保存成功！', 'success');
      setTimeout(() => {
        setIsSaveProgressModalOpen(false);
        setSaveStatus('idle');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
      setSaveError(err.message || '保存文件失败');
      // Auto close after error
      setTimeout(() => {
        setIsSaveProgressModalOpen(false);
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="h-screen w-screen flex bg-secondary-50 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 overflow-hidden font-sans relative">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        openDirectory={openDirectory}
        rootHandle={rootHandle}
        fileList={fileList}
        currentFile={currentFile}
        onFileSelect={(node) => {
          setCurrentFile(node);
          setIsEditing(false);
        }}
      />

      <Changelog 
        isOpen={isChangelogOpen} 
        onClose={() => setIsChangelogOpen(false)} 
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-secondary-900 border-b-0">
        {currentFile ? (
          <>
            {!isEditing && (
              <Header
                currentFile={currentFile}
                onEdit={() => setIsEditing(true)}
                onBack={() => setCurrentFile(null)}
                onExportHTML={handleExportHTML}
              />
            )}

            <div className="flex-1 overflow-hidden relative animate-fade-in">
              {currentFile && (
                <EditorPane
                  content={content}
                  previewContent={previewContent}
                  onChange={handleEditorChange}
                  onSave={handleSave}
                  onExitEdit={handleExitEdit}
                  fileName={currentFile.name}
                  isOpen={isEditing}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary-300 dark:text-secondary-600 animate-fade-in relative bg-secondary-50 dark:bg-secondary-950">
            <div className="max-w-md text-center px-6">
              <img src="/smart-md-editor-v2/favicon.svg" alt="logo" className="w-20 h-20 mx-auto mb-6 opacity-20 grayscale" />
              <h2 className="text-2xl font-bold text-secondary-400 dark:text-secondary-500 mb-4">Super-MDEditor</h2>
              <p className="text-secondary-400 dark:text-secondary-600 mb-8">极简、纯粹的 Markdown 编辑体验。点击左侧目录图标打开文件夹开始创作。</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-500/20 font-medium"
                >
                  打开目录
                </button>
                <button
                  onClick={() => setIsChangelogOpen(true)}
                  className="flex items-center px-6 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-300 rounded-lg transition-colors font-medium"
                >
                  更新日志
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Modal Toggles (Floating) */}
        <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-[90]">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-12 h-12 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-full shadow-lg flex items-center justify-center text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all hover:scale-110"
              title="打开目录"
            >
              <FolderOpen size={20} />
            </button>
          )}
          {!isChangelogOpen && (
            <button
              onClick={() => setIsChangelogOpen(true)}
              className="w-12 h-12 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-full shadow-lg flex items-center justify-center text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all hover:scale-110"
              title="打开更新日志"
            >
              <History size={20} />
            </button>
          )}
        </div>

        {toast && (
          <div className={`absolute bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-up z-[200] ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {toast.message}
          </div>
        )}

        <ProgressModal
          isOpen={isHTMLProgressModalOpen}
          progress={htmlExportProgress}
          status={htmlExportStatus}
          errorMessage={htmlExportError}
          processingText="正在处理图片和样式..."
          successText="导出成功！"
          errorText="导出失败"
        />

        <ProgressModal
          isOpen={isSaveProgressModalOpen}
          progress={saveProgress}
          status={saveStatus}
          errorMessage={saveError}
          processingText="正在保存文件..."
          successText="保存成功！"
          errorText="保存失败"
        />
      </div>
    </div>
  );
}

export default App;
