import React from 'react';
import { FolderOpen } from 'lucide-react';
import { FileExplorer } from '../FileExplorer';
import { FileNode } from '../../types';
import { DraggableModal } from '../common/DraggableModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  openDirectory: () => void;
  rootHandle: FileSystemDirectoryHandle | null;
  fileList: FileNode[];
  currentFile: FileNode | null;
  onFileSelect: (node: FileNode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  openDirectory,
  rootHandle,
  fileList,
  currentFile,
  onFileSelect,
}) => {
  const initialPosition = { x: 40, y: (window.innerHeight - 750) / 2 };
  const initialWidth = Math.max(300, window.innerWidth * 0.2);

  return (
    <DraggableModal
      id="sidebar"
      title="目录列表"
      isOpen={isOpen}
      onClose={onClose}
      icon={<FolderOpen size={18} className="text-primary-600 dark:text-primary-400" />}
      initialPosition={initialPosition}
      initialSize={{ width: initialWidth, height: 750 }}
    >
      <div className="flex flex-col h-full bg-white dark:bg-secondary-900">
        <div className="h-12 flex items-center justify-between px-4 border-b border-secondary-100 dark:border-secondary-800">
          <div className="flex items-center gap-2">
            <img src="/smart-md-editor-v2/favicon.svg" alt="logo" className="w-4 h-4" />
            <span className="font-bold text-sm text-secondary-900 dark:text-secondary-100">项目目录</span>
          </div>
          <button
            onClick={openDirectory}
            className="p-1.5 hover:bg-secondary-200 dark:hover:bg-secondary-800 rounded text-secondary-600 dark:text-secondary-400 transition-colors"
            title="打开文件夹"
          >
            <FolderOpen size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {rootHandle ? (
            <FileExplorer
              fileList={fileList}
              onFileClick={onFileSelect}
              currentFileId={currentFile?.id}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-secondary-400 p-6 text-center">
              <FolderOpen size={40} className="mb-4 opacity-50" />
              <p className="text-xs">点击文件夹图标打开目录</p>
            </div>
          )}
        </div>
      </div>
    </DraggableModal>
  );
};
