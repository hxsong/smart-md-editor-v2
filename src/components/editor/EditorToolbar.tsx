import React from 'react';
import { FileText } from 'lucide-react';

interface EditorToolbarProps {
  fileName: string;
  onSave: () => void;
  onExitEdit: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  fileName, 
  onSave, 
  onExitEdit
}) => {
  return (
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
          className="h-8 flex items-center justify-center text-sm bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white px-5 rounded transition-all shadow-sm hover:shadow font-medium whitespace-nowrap min-w-[80px]"
        >
          保存
        </button>
      </div>
      
      <button
        onClick={onExitEdit}
        className="h-8 flex items-center justify-center bg-white dark:bg-secondary-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary-600 dark:text-secondary-300 hover:text-red-600 dark:hover:text-red-400 border border-secondary-200 dark:border-secondary-700 hover:border-red-200 dark:hover:border-red-800 px-5 rounded transition-all text-sm font-medium whitespace-nowrap min-w-[80px]"
      >
        退出
      </button>
    </div>
  );
};
