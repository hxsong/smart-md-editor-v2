import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, RotateCcw, GripHorizontal, Minus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DraggableModalProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  badgeCount?: number;
  initialPosition?: Position;
  initialSize?: Size;
  minSize?: Size;
  className?: string;
  onMinimizeChange?: (isMinimized: boolean) => void;
}

interface ModalState {
  position: Position;
  size: Size;
  isMinimized: boolean;
}

const DEFAULT_MIN_SIZE: Size = { width: 300, height: 400 };

export const DraggableModal: React.FC<DraggableModalProps> = ({
  id,
  title,
  icon,
  children,
  isOpen,
  onClose,
  badgeCount,
  initialPosition,
  initialSize = { width: 350, height: 500 },
  minSize = DEFAULT_MIN_SIZE,
  className,
  onMinimizeChange,
}) => {
  const [state, setState] = useState<ModalState>(() => {
    const saved = localStorage.getItem(`modal_state_${id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse modal state', e);
      }
    }
    return {
      position: initialPosition || { x: 20, y: 80 },
      size: initialSize,
      isMinimized: false,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [resizingDir, setResizingDir] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const initialDragState = useRef<ModalState | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem(`modal_state_${id}`, JSON.stringify(state));
  }, [id, state]);

  // Handle Dragging
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (state.isMinimized) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    dragStartPos.current = { x: clientX, y: clientY };
    initialDragState.current = { ...state };
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
  }, [state]);

  // Handle Resizing
  const handleResizeStart = useCallback((dir: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setResizingDir(dir);
    dragStartPos.current = { x: clientX, y: clientY };
    initialDragState.current = { ...state };
    document.body.style.userSelect = 'none';
  }, [state]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging && !resizingDir) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;

    requestAnimationFrame(() => {
      if (isDragging && initialDragState.current) {
        let nextX = initialDragState.current.position.x + deltaX;
        let nextY = initialDragState.current.position.y + deltaY;

        // Bounds check
        const padding = 10;
        nextX = Math.max(padding, Math.min(window.innerWidth - state.size.width - padding, nextX));
        nextY = Math.max(padding, Math.min(window.innerHeight - 60 - padding, nextY));

        setState(prev => ({
          ...prev,
          position: { x: nextX, y: nextY }
        }));
      } else if (resizingDir && initialDragState.current) {
        let { x, y } = initialDragState.current.position;
        let { width, height } = initialDragState.current.size;

        if (resizingDir.includes('e')) width += deltaX;
        if (resizingDir.includes('w')) {
          const newWidth = width - deltaX;
          if (newWidth >= minSize.width) {
            width = newWidth;
            x += deltaX;
          }
        }
        if (resizingDir.includes('s')) height += deltaY;
        if (resizingDir.includes('n')) {
          const newHeight = height - deltaY;
          if (newHeight >= minSize.height) {
            height = newHeight;
            y += deltaY;
          }
        }

        // Apply min sizes
        width = Math.max(minSize.width, width);
        height = Math.max(minSize.height, height);

        setState(prev => ({
          ...prev,
          position: { x, y },
          size: { width, height }
        }));
      }
    });
  }, [isDragging, resizingDir, state.size, minSize]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizingDir(null);
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging || resizingDir) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalMouseMove);
      window.addEventListener('touchend', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, resizingDir, handleGlobalMouseMove, handleGlobalMouseUp]);

  const toggleMinimize = useCallback(() => {
    setState(prev => {
      const nextMinimized = !prev.isMinimized;
      if (onMinimizeChange) {
        onMinimizeChange(nextMinimized);
      }
      return {
        ...prev,
        isMinimized: nextMinimized
      };
    });
  }, [onMinimizeChange]);

  const resetLayout = () => {
    setState({
      position: initialPosition || { x: 20, y: 80 },
      size: initialSize,
      isMinimized: false,
    });
  };

  if (!isOpen) return null;

  // Responsive checks
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[100] bg-white dark:bg-secondary-900 rounded-t-2xl shadow-2xl border-t border-secondary-200 dark:border-secondary-800 transition-all duration-300 ease-in-out transform translate-y-0 max-h-[80vh] flex flex-col animate-slide-up">
        <div className="h-1.5 w-12 bg-secondary-200 dark:bg-secondary-700 rounded-full mx-auto my-3 shrink-0" />
        <div className="flex items-center justify-between px-4 pb-2 border-b border-secondary-100 dark:border-secondary-800">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-bold text-secondary-900 dark:text-secondary-100">{title}</span>
          </div>
          <button onClick={onClose} className="p-2 text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    );
  }

  if (state.isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-[100] group animate-fade-in"
        title={`恢复 ${title}`}
      >
        <div className="text-white [&_svg]:!text-white">
          {icon || <Maximize2 size={24} />}
        </div>
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-secondary-900">
            {badgeCount}
          </span>
        )}
        <div className="absolute bottom-full mb-2 right-0 bg-secondary-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
          {title}
        </div>
      </button>
    );
  }

  const resizeHandles = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

  return (
    <div
      ref={modalRef}
      className={cn(
        "fixed z-[100] bg-white dark:bg-secondary-900 shadow-2xl rounded-xl border border-secondary-200 dark:border-secondary-800 flex flex-col overflow-hidden transition-all duration-300 ease-out animate-zoom-in",
        (isDragging || resizingDir) && "shadow-inner opacity-70 ring-2 ring-primary-500/30 transition-none",
        className
      )}
      style={{
        left: state.position.x,
        top: state.position.y,
        width: state.size.width,
        height: state.size.height,
        maxWidth: isTablet ? '50vw' : '90vw',
        maxHeight: '90vh',
      }}
    >
      {/* Resize Handles */}
      {resizeHandles.map(dir => (
        <div
          key={dir}
          className={cn(
            "absolute z-[101]",
            dir === 'n' && "top-0 left-0 right-0 h-1 cursor-ns-resize",
            dir === 's' && "bottom-0 left-0 right-0 h-1 cursor-ns-resize",
            dir === 'e' && "right-0 top-0 bottom-0 w-1 cursor-ew-resize",
            dir === 'w' && "left-0 top-0 bottom-0 w-1 cursor-ew-resize",
            dir === 'ne' && "top-0 right-0 w-3 h-3 cursor-nesw-resize",
            dir === 'nw' && "top-0 left-0 w-3 h-3 cursor-nwse-resize",
            dir === 'se' && "bottom-0 right-0 w-3 h-3 cursor-nwse-resize",
            dir === 'sw' && "bottom-0 left-0 w-3 h-3 cursor-nesw-resize",
          )}
          onMouseDown={(e) => handleResizeStart(dir, e)}
          onTouchStart={(e) => handleResizeStart(dir, e)}
        />
      ))}

      {/* Header / Drag Area */}
      <div
        className="h-10 px-3 flex items-center justify-between bg-secondary-50/50 dark:bg-secondary-800/50 border-b border-secondary-200 dark:border-secondary-800 cursor-move select-none shrink-0"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {icon}
          <span className="font-semibold text-xs text-secondary-700 dark:text-secondary-300 truncate">
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <div className="p-1 text-secondary-400 opacity-30 mr-1">
            <GripHorizontal size={14} />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); resetLayout(); }}
            className="p-1.5 text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-md transition-colors"
            title="重置布局"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}
            className="p-1.5 text-secondary-500 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-md transition-colors"
            title="最小化"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 text-secondary-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 rounded-md transition-colors"
            title="关闭"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};
