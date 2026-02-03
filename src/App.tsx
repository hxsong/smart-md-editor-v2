import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { useFileSystem } from './hooks/useFileSystem';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EditorPane } from './components/EditorPane';
import { MarkdownPreview } from './components/MarkdownPreview';
import { Changelog } from './components/Changelog';
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

  const handleEditorChange = useCallback((value: string) => {
    setContent(value);
    debouncedUpdatePreview(value);
  }, [debouncedUpdatePreview]);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!previewRef.current) {
      showToast('无法获取预览内容', 'error');
      return;
    }

    try {
      showToast('正在生成 PDF...', 'success');
      
      // Dynamically import html2pdf.js to avoid SSR issues and reduce initial bundle size
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = previewRef.current;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `${currentFile?.name || 'document'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
      showToast('PDF 导出成功！', 'success');
    } catch (err: any) {
      console.error('Export PDF error:', err);
      showToast('导出 PDF 失败: ' + err.message, 'error');
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

    try {
      await saveFile(currentFile, content);
      showToast('文件保存成功！', 'success');
    } catch (err) {
      console.error(err);
      showToast('保存文件失败。', 'error');
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
                onExportPDF={handleExportPDF}
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
      </div>
    </div>
  );
}

export default App;
