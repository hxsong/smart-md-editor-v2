import React from 'react';
import { FileText, Edit3, ChevronLeft, Download } from 'lucide-react';
import { FileNode } from '../../types';

interface HeaderProps {
  currentFile: FileNode;
  onEdit: () => void;
  onBack: () => void;
  onExportHTML: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentFile, onEdit, onBack, onExportHTML }) => {
  return (
    <div className="h-14 flex items-center justify-between px-4 bg-white dark:bg-secondary-900 z-10 animate-fade-in">
      <div className="flex items-center gap-2 overflow-hidden">
        <button 
          onClick={onBack}
          className="md:hidden p-1.5 -ml-2 mr-1 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-full text-secondary-600 dark:text-secondary-400 transition-colors"
          title="返回文件列表"
        >
          <ChevronLeft size={22} />
        </button>
        <FileText size={18} className="text-primary-500 flex-shrink-0" />
        <h1 className="font-semibold text-lg truncate text-secondary-900 dark:text-secondary-100">{currentFile.name}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onExportHTML}
          className="h-8 flex items-center gap-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700 text-secondary-700 dark:text-secondary-200 px-3 rounded transition-all shadow-sm hover:shadow active:scale-95 text-sm font-medium whitespace-nowrap"
        >
          <Download size={16} />
          导出 HTML
        </button>

        <button
          onClick={onEdit}
          className="h-8 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 rounded transition-all shadow-sm hover:shadow active:scale-95 text-sm font-medium whitespace-nowrap"
        >
          <Edit3 size={16} />
          编辑
        </button>
      </div>
    </div>
  );
};
