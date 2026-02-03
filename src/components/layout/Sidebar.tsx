import React from 'react';
import { FolderOpen } from 'lucide-react';
import { FileExplorer } from '../FileExplorer';
import { FileNode } from '../../types';

interface SidebarProps {
  isEditing: boolean;
  openDirectory: () => void;
  rootHandle: FileSystemDirectoryHandle | null;
  fileList: FileNode[];
  currentFile: FileNode | null;
  onFileSelect: (node: FileNode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isEditing,
  openDirectory,
  rootHandle,
  fileList,
  currentFile,
  onFileSelect,
}) => {
  return (
    <div className={`border-r border-secondary-200 dark:border-secondary-700 flex flex-col bg-secondary-50 dark:bg-secondary-950 transition-all duration-300 ease-in-out h-full ${
      isEditing 
        ? 'w-0 border-none overflow-hidden' 
        : (currentFile ? 'hidden md:flex md:w-64' : 'w-full md:w-64')
    }`}>
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/smart-md-editor-v2/favicon.svg" alt="logo" className="w-5 h-5" />
            <span className="font-bold text-base text-secondary-900 dark:text-secondary-100">Super-MDEditor</span>
          </div>
          <button
            onClick={openDirectory}
            className="p-1.5 hover:bg-secondary-200 dark:hover:bg-secondary-800 rounded text-secondary-600 dark:text-secondary-400 transition-colors"
            title="打开文件夹"
          >
            <FolderOpen size={20} />
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
              <FolderOpen size={48} className="mb-4 opacity-50" />
              <p className="text-sm">点击文件夹图标打开目录</p>
            </div>
          )}
        </div>
      </div>
  );
};
