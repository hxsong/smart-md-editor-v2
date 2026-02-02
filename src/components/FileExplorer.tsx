import React, { useState } from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
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
          "flex items-center py-1 px-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none text-sm",
          isSelected && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        <span className="mr-1 text-slate-400">
          {node.kind === 'directory' ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-[14px] inline-block" />
          )}
        </span>
        
        <span className="mr-2 text-blue-500 dark:text-blue-400">
          {node.kind === 'directory' ? (
            isOpen ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <FileText size={16} className="text-slate-500 dark:text-slate-400" />
          )}
        </span>
        
        <span className="truncate">{node.name}</span>
      </div>
      
      {node.kind === 'directory' && isOpen && node.children && (
        <div>
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
    <div className="h-full overflow-y-auto py-2">
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
        <div className="text-center text-slate-400 text-sm mt-10 px-4">
          No files found. Click "Open Folder" to start.
        </div>
      )}
    </div>
  );
};
