import React, { useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItToc from 'markdown-it-table-of-contents';
import markdownItTexmath from 'markdown-it-texmath';
import katex from 'katex';
import mermaid from 'mermaid';
import plantumlEncoder from 'plantuml-encoder';
import * as echarts from 'echarts';
import tablesort from 'tablesort';

// Initialize markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
  .use(markdownItFootnote)
  .use(markdownItTaskLists)
  .use(markdownItToc, {
    includeLevel: [1, 2, 3],
    containerClass: 'table-of-contents',
    slugify: (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, '-')),
  })
  .use(markdownItTexmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { macros: { "\\RR": "\\mathbb{R}" } }
  });

// Table wrapper renderer
const defaultTableOpen = md.renderer.rules.table_open || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};
const defaultTableClose = md.renderer.rules.table_close || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.table_open = (tokens, idx, options, _env, self) => {
  const line = tokens[idx].map ? tokens[idx].map[0] : '';
  const lineEnd = tokens[idx].map ? tokens[idx].map[1] : '';
  return `<div class="table-wrapper overflow-x-auto my-6 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 shadow-sm" data-line="${line}" data-line-end="${lineEnd}">${defaultTableOpen(tokens, idx, options, _env, self)}`;
};

md.renderer.rules.table_close = (tokens, idx, options, _env, self) => {
  return `${defaultTableClose(tokens, idx, options, _env, self)}</div>`;
};

// Custom image renderer for stability
const defaultImage = md.renderer.rules.image || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.image = (tokens, idx, options, _env, self) => {
  const token = tokens[idx];
  const line = token.map ? token.map[0] : '';
  
  // Add loading="lazy" and ensure display block to avoid vertical-align jumps
  token.attrSet('loading', 'lazy');
  token.attrJoin('class', 'max-w-full h-auto rounded-lg shadow-md my-4 block');
  
  const rendered = defaultImage(tokens, idx, options, _env, self);
  return `<div class="image-container min-h-[20px] bg-secondary-50 dark:bg-secondary-900/50 rounded-lg" data-line="${line}">${rendered}</div>`;
};

// Inject line numbers
const injectLineNumbers = (tokens: any, idx: number, options: any, _env: any, self: any) => {
  if (tokens[idx].map) {
    tokens[idx].attrJoin('class', 'line');
    tokens[idx].attrSet('data-line', String(tokens[idx].map[0]));
    tokens[idx].attrSet('data-line-end', String(tokens[idx].map[1]));
  }
  return self.renderToken(tokens, idx, options);
};

['paragraph_open', 'heading_open', 'image', 'code_block', 'blockquote_open', 'list_item_open', 'tr_open'].forEach((rule) => {
  md.renderer.rules[rule] = injectLineNumbers;
});

// Custom fence renderer
const defaultFence = md.renderer.rules.fence || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.fence = (tokens, idx, options, _env, self) => {
  const token = tokens[idx];
  const info = token.info.trim();
  const line = token.map ? token.map[0] : '';
  const lineEnd = token.map ? token.map[1] : '';
  
  if (info === 'mermaid') {
    return `<div class="mermaid" data-line="${line}" data-line-end="${lineEnd}">${token.content}</div>`;
  }
  
  if (info === 'plantuml') {
    try {
      const encoded = plantumlEncoder.encode(token.content);
      const url = `http://www.plantuml.com/plantuml/svg/${encoded}`;
      return `<div class="flex justify-center my-4" data-line="${line}" data-line-end="${lineEnd}"><img src="${url}" alt="PlantUML Diagram" /></div>`;
    } catch (e) {
      return `<div class="text-red-500" data-line="${line}" data-line-end="${lineEnd}">PlantUML Error: ${e}</div>`;
    }
  }

  if (info === 'echarts' || info === 'json echarts') {
    return `<div class="echarts-chart w-full h-96 my-4" data-line="${line}" data-line-end="${lineEnd}"><script type="application/json">${token.content}</script></div>`;
  }
  
  const rendered = defaultFence(tokens, idx, options, _env, self);
  return `<div data-line="${line}" data-line-end="${lineEnd}">${rendered}</div>`;
};

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

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className, onScroll, onMouseUp, onKeyUp, onClick, previewRef }) => {
  const containerRef = previewRef || useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);
  const lastRenderedHtmlRef = useRef('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mermaidCacheRef = useRef<Record<string, string>>({});
  const lastScrollTopRef = useRef(0);

  // 1. 增强型滚动追踪
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget) {
      lastScrollTopRef.current = e.currentTarget.scrollTop;
    }
    if (onScroll) onScroll(e);
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

      // 4. 执行同步更新（核心修复点：跳过 React State 异步循环）
      if (isActive && contentWrapperRef.current && containerRef.current) {
        const newHtml = tempDiv.innerHTML;
        if (newHtml !== lastRenderedHtmlRef.current) {
          const container = containerRef.current;
          const wrapper = contentWrapperRef.current;
          
          // 记录当前滚动
          const currentScroll = lastScrollTopRef.current;
          
          // 【同步更新】在同一个 JS 任务中完成 DOM 替换和滚动恢复
          wrapper.innerHTML = newHtml;
          container.scrollTop = currentScroll;
          
          // 初始化辅助组件
          initAuxiliaryComponents(wrapper);
          
          // 再次确保滚动位置（防止图片等即时加载导致的偏移）
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

  // 移除原有的 [renderedContent] useEffect，逻辑已整合至 render 函数中

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
      onClick={onClick}
    >
      <div 
        ref={contentWrapperRef}
      />
    </div>
  );
};
