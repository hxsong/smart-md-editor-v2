import React, { useState } from 'react';
import { FileNode } from '../types';
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import clsx from 'clsx';

interface FileExplorerProps {
  fileList: FileNode[];
  onFileClick: (node: FileNode) => void;
  currentFileId: string | undefined;
}

const FileNodeItem: React.FC<{
  node: FileNode;
  onFileClick: (node: FileNode) => void;
  currentFileId: string | undefined;
  depth: number;
}> = ({ node, onFileClick, currentFileId, depth }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (node.kind === 'directory') {
      setIsOpen(!isOpen);
    } else {
      console.log('File clicked:', node.name);
      onFileClick(node);
    }
  };

  const isSelected = node.id === currentFileId;

  return (
    <div>
      <div
        className={clsx(
          "flex items-center py-1.5 cursor-pointer transition-all duration-200 select-none text-sm rounded-md",
          isSelected 
            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium" 
            : "text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-200"
        )}
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
        onClick={handleClick}
      >
        <div className="w-4 flex-shrink-0 flex items-center justify-center -ml-4 mr-0 transition-transform duration-200">
          {node.kind === 'directory' ? (
             <span className={clsx(isOpen && "rotate-90")}>
               <ChevronRight size={14} className={clsx(isSelected ? "text-primary-500" : "text-secondary-400")} />
             </span>
          ) : null}
        </div>
        
        <span className={clsx("mr-2", isSelected ? "text-primary-500" : "text-secondary-500 dark:text-secondary-400")}>
          {node.kind === 'directory' ? (
            isOpen ? <FolderOpen size={18} /> : <Folder size={18} />
          ) : (
            <FileText size={18} />
          )}
        </span>
        
        <span className="truncate">{node.name}</span>
      </div>
      
      {node.kind === 'directory' && isOpen && node.children && (
        <div className="animate-slide-up origin-top">
          {node.children.map(child => (
            <FileNodeItem
              key={child.id}
              node={child}
              onFileClick={onFileClick}
              currentFileId={currentFileId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ fileList, onFileClick, currentFileId }) => {
  return (
    <div className="h-full overflow-y-auto py-2 animate-fade-in custom-scrollbar">
      {fileList.map(node => (
        <FileNodeItem
          key={node.id}
          node={node}
          onFileClick={onFileClick}
          currentFileId={currentFileId}
          depth={0}
        />
      ))}
      {fileList.length === 0 && (
        <div className="flex flex-col items-center justify-center text-secondary-400 text-sm mt-10 px-4 gap-2">
          <FolderOpen size={48} className="opacity-50 mb-2" />
          <p className="text-sm">未发现文件。点击“打开文件夹”开始。</p>
        </div>
      )}
    </div>
  );
};
