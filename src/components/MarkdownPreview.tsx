import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import * as echarts from 'echarts';
import tablesort from 'tablesort';
import { ArrowUp } from 'lucide-react';
import { md } from '../utils/markdown-utils';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
});

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  content, 
  className, 
  onScroll, 
  onMouseUp, 
  onKeyUp, 
  onClick, 
  previewRef 
}) => {
  const containerRef = previewRef || useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);
  const lastRenderedHtmlRef = useRef('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mermaidCacheRef = useRef<Record<string, string>>({});
  const lastScrollTopRef = useRef(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 1. 增强型滚动追踪
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    lastScrollTopRef.current = scrollTop;
    setShowBackToTop(scrollTop > 300);
    if (onScroll) onScroll(e);
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Handle link clicks for internal navigation (TOC)
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    
    if (anchor && anchor.hash && anchor.hash.startsWith('#')) {
      e.preventDefault();
      const id = decodeURIComponent(anchor.hash.slice(1));
      
      // Use querySelector with escaped ID for better matching
      const escapedId = CSS.escape(id);
      const element = containerRef.current?.querySelector(`#${escapedId}`) || 
                      containerRef.current?.querySelector(`[id="${escapedId}"]`);
      
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      } else {
        console.warn(`Target element not found for ID: ${id}`);
      }
    }
    
    if (onClick) onClick(e);
  };

  // 辅助组件初始化函数
  const initAuxiliaryComponents = (container: HTMLElement) => {
    // Render ECharts
    const chartContainers = container.querySelectorAll('.echarts-chart');
    chartContainers.forEach((container) => {
      const div = container as HTMLDivElement;
      if (div.getAttribute('data-processed')) return;
      
      const script = div.querySelector('script');
      if (script && script.textContent) {
        try {
          const option = JSON.parse(script.textContent);
          const chart = echarts.init(div);
          chart.setOption(option);
          div.setAttribute('data-processed', 'true');
          
          const resizeObserver = new ResizeObserver(() => {
              chart.resize();
              if (containerRef.current) {
                containerRef.current.scrollTop = lastScrollTopRef.current;
              }
          });
          resizeObserver.observe(div);
        } catch (e) {
          console.error('ECharts render error:', e);
          div.innerHTML = `<div class="text-red-500 p-4 border border-red-300 bg-red-50 rounded">Error rendering chart: Invalid JSON configuration</div>`;
        }
      }
    });

    // Tablesort
    const tables = container.querySelectorAll('table');
    tables.forEach((table) => {
       if (table.getAttribute('data-tablesort-initialized')) return;
       tablesort(table);
       table.setAttribute('data-tablesort-initialized', 'true');
       
       table.querySelectorAll('th, td').forEach(cell => {
         (cell as HTMLElement).style.padding = '0.75rem 1rem';
       });
    });
  };

  useEffect(() => {
    let isActive = true;

    const render = async () => {
      // 1. Generate Raw HTML
      const rawHtml = md.render(content);
      
      // 2. Create Temp DOM for manipulation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = rawHtml;

      // 3. Process Mermaid Diagrams
      const mermaidNodes = tempDiv.querySelectorAll('.mermaid');
      
      if (mermaidNodes.length > 0) {
        await Promise.all(Array.from(mermaidNodes).map(async (node) => {
          try {
            const text = node.textContent || '';
            const line = node.getAttribute('data-line');
            const lineEnd = node.getAttribute('data-line-end');
            const cacheKey = text.trim();
            
            if (mermaidCacheRef.current[cacheKey]) {
              node.outerHTML = `<div class="mermaid-container" data-line="${line}" data-line-end="${lineEnd}">${mermaidCacheRef.current[cacheKey]}</div>`;
            } else {
              const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
              const { svg } = await mermaid.render(id, text);
              mermaidCacheRef.current[cacheKey] = svg;
              node.outerHTML = `<div class="mermaid-container" data-line="${line}" data-line-end="${lineEnd}">${svg}</div>`;
            }
          } catch (error) {
            console.error('Mermaid render error:', error);
            node.innerHTML = `<div class="text-red-500 border border-red-300 bg-red-50 p-2 rounded">Mermaid 渲染错误: ${(error as any).message}</div><pre>${node.textContent}</pre>`;
          }
        }));
      }

      // 4. 执行同步更新
      if (isActive && contentWrapperRef.current && containerRef.current) {
        const newHtml = tempDiv.innerHTML;
        if (newHtml !== lastRenderedHtmlRef.current) {
          const container = containerRef.current;
          const wrapper = contentWrapperRef.current;
          
          // 记录当前滚动
          const currentScroll = lastScrollTopRef.current;
          
          // 【同步更新】
          wrapper.innerHTML = newHtml;
          container.scrollTop = currentScroll;
          
          // 初始化辅助组件
          initAuxiliaryComponents(wrapper);
          
          // 再次确保滚动位置
          container.scrollTop = currentScroll;
          
          lastRenderedHtmlRef.current = newHtml;
        }
      }
    };

    const isInitialLoad = lastRenderedHtmlRef.current === '';
    const contentDiff = Math.abs(content.length - lastContentRef.current.length);
    
    if (isInitialLoad || contentDiff > 50) {
      render();
    } else {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        render();
      }, 300);
    }

    lastContentRef.current = content;

    return () => {
      isActive = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`prose prose-slate dark:prose-invert max-w-none p-8 overflow-y-auto h-full scroll-smooth cursor-pointer relative ${className} 
        prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl 
        prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
        prose-img:rounded-lg prose-img:shadow-md
        prose-pre:bg-secondary-900 prose-pre:border prose-pre:border-secondary-800
        prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-secondary-100 dark:prose-code:bg-secondary-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-table:my-0 prose-table:border-collapse
      `}
      style={{ overflowAnchor: 'none' }}
      onScroll={handleScroll}
      onMouseUp={onMouseUp}
      onKeyUp={onKeyUp}
      onClick={handlePreviewClick}
    >
      <div 
        ref={contentWrapperRef}
      />
      
      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-primary-600 text-white shadow-lg transition-all duration-300 hover:bg-primary-700 active:scale-95 z-50 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        title="返回顶部"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};
