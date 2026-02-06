import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ProgressModalProps {
  isOpen: boolean;
  progress: number;
  status: 'idle' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  processingText?: string;
  successText?: string;
  errorText?: string;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  progress,
  status,
  errorMessage,
  processingText = '正在处理...',
  successText = '处理成功！',
  errorText = '处理失败'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in">
      <div className="bg-white dark:bg-secondary-900 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-secondary-200 dark:border-secondary-800 p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-600 dark:text-secondary-400 font-medium">
              {status === 'processing' && processingText}
              {status === 'success' && successText}
              {status === 'error' && errorText}
            </span>
            <span className="font-bold text-primary-600 dark:text-primary-400">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ease-out ${
                status === 'error' ? 'bg-red-500' : 'bg-primary-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {status === 'error' && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1 animate-shake">
              <AlertCircle size={12} />
              {errorMessage || '处理过程中发生错误'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
