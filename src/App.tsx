import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { useFileSystem } from './hooks/useFileSystem';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EditorPane } from './components/EditorPane';
import { MarkdownPreview } from './components/MarkdownPreview';
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

  const debouncedUpdatePreview = useMemo(
    () => debounce((val: string) => setPreviewContent(val), 200),
    []
  );

  const handleEditorChange = useCallback((value: string) => {
    setContent(value);
    debouncedUpdatePreview(value);
  }, [debouncedUpdatePreview]);

  const previewRef = useRef<HTMLDivElement>(null);

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
    }
  }, [currentFile, readFile]);

  const handleExitEdit = useCallback(async () => {
    if (currentFile) {
      try {
        const text = await readFile(currentFile);
        setContent(text);
        setPreviewContent(text);
      } catch (err) {
        console.error('Error reverting changes:', err);
      }
    }
    setIsEditing(false);
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
    <div className="h-screen w-screen flex bg-secondary-50 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 overflow-hidden font-sans">
      <Sidebar
        isEditing={isEditing}
        openDirectory={openDirectory}
        rootHandle={rootHandle}
        fileList={fileList}
        currentFile={currentFile}
        onFileSelect={(node) => {
          setCurrentFile(node);
          setIsEditing(false);
        }}
      />

      <div className={`flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-secondary-900 border-b-0 ${!currentFile ? 'hidden md:flex' : 'flex'}`}>
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
              {isEditing ? (
                <div className="h-full flex flex-col">
                  <EditorPane
                    content={content}
                    previewContent={previewContent}
                    onChange={handleEditorChange}
                    onSave={handleSave}
                    onExitEdit={handleExitEdit}
                    onExportHTML={handleExportHTML}
                    fileName={currentFile.name}
                  />
                </div>
              ) : (
                <MarkdownPreview 
                  content={previewContent || content} 
                  previewRef={previewRef}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary-300 dark:text-secondary-600 animate-fade-in relative">
            <Changelog />
          </div>
        )}

        {toast && (
          <div className={`absolute bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-up ${
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
