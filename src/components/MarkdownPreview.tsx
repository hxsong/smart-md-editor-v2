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

// Inject line numbers
const injectLineNumbers = (tokens: any, idx: number, options: any, _env: any, self: any) => {
  if (tokens[idx].map && tokens[idx].level === 0) {
    tokens[idx].attrJoin('class', 'line');
    tokens[idx].attrSet('data-line', String(tokens[idx].map[0]));
  }
  return self.renderToken(tokens, idx, options);
};

['paragraph_open', 'heading_open', 'image', 'code_block', 'table_open', 'blockquote_open', 'list_item_open'].forEach((rule) => {
  md.renderer.rules[rule] = injectLineNumbers;
});

// Custom fence renderer
const defaultFence = md.renderer.rules.fence || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};

md.renderer.rules.fence = (tokens, idx, options, _env, self) => {
  const token = tokens[idx];
  const info = token.info.trim();
  
  if (info === 'mermaid') {
    return `<div class="mermaid">${token.content}</div>`;
  }
  
  if (info === 'plantuml') {
    try {
      const encoded = plantumlEncoder.encode(token.content);
      const url = `http://www.plantuml.com/plantuml/svg/${encoded}`;
      return `<div class="flex justify-center my-4"><img src="${url}" alt="PlantUML Diagram" /></div>`;
    } catch (e) {
      return `<div class="text-red-500">PlantUML Error: ${e}</div>`;
    }
  }

  if (info === 'echarts' || info === 'json echarts') {
    return `<div class="echarts-chart w-full h-96 my-4"><script type="application/json">${token.content}</script></div>`;
  }
  
  return defaultFence(tokens, idx, options, _env, self);
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
  const [renderedContent, setRenderedContent] = React.useState('');

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
        await Promise.all(Array.from(mermaidNodes).map(async (node, index) => {
          try {
            const id = `mermaid-${Date.now()}-${index}`;
            const text = node.textContent || '';
            const { svg } = await mermaid.render(id, text);
            node.outerHTML = svg;
          } catch (error) {
            console.error('Mermaid render error:', error);
            // Keep the original content but wrap in error style or leave as is
             node.innerHTML = `<div class="text-red-500 border border-red-300 bg-red-50 p-2 rounded">Mermaid Error: ${(error as any).message}</div><pre>${node.textContent}</pre>`;
          }
        }));
      }

      // 4. Update State if still mounted/active
      if (isActive) {
        setRenderedContent(tempDiv.innerHTML);
      }
    };

    render();

    return () => {
      isActive = false;
    };
  }, [content]);

  useEffect(() => {
    if (containerRef.current) {
      // Render ECharts
      const chartContainers = containerRef.current.querySelectorAll('.echarts-chart');
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
            
            // Handle resize
            const resizeObserver = new ResizeObserver(() => {
                chart.resize();
            });
            resizeObserver.observe(div);
          } catch (e) {
            console.error('ECharts render error:', e);
            div.innerHTML = `<div class="text-red-500 p-4 border border-red-300 bg-red-50 rounded">Error rendering chart: Invalid JSON configuration</div>`;
          }
        }
      });

      // Tablesort
      const tables = containerRef.current.querySelectorAll('table');
      tables.forEach((table) => {
         tablesort(table);
         // Add responsive wrapper if not already wrapped
         if (!table.parentElement?.classList.contains('table-wrapper')) {
           const wrapper = document.createElement('div');
           wrapper.className = 'table-wrapper overflow-x-auto my-6 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 shadow-sm';
           table.parentNode?.insertBefore(wrapper, table);
           wrapper.appendChild(table);
           
           // Ensure table headers and cells have consistent padding
           table.querySelectorAll('th, td').forEach(cell => {
             (cell as HTMLElement).style.padding = '0.75rem 1rem';
           });
         }
      });
    }
  }, [renderedContent]);

  return (
    <div
      ref={containerRef}
      className={`prose prose-slate dark:prose-invert max-w-none p-8 overflow-y-auto h-full scroll-smooth ${className} 
        prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl 
        prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
        prose-img:rounded-lg prose-img:shadow-md
        prose-pre:bg-secondary-900 prose-pre:border prose-pre:border-secondary-800
        prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-code:bg-secondary-100 dark:prose-code:bg-secondary-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-table:my-0 prose-table:border-collapse
      `}
      onScroll={onScroll}
      onMouseUp={onMouseUp}
      onKeyUp={onKeyUp}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
