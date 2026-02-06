import MarkdownIt from 'markdown-it';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItToc from 'markdown-it-table-of-contents';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTexmath from 'markdown-it-texmath';
import katex from 'katex';
import plantumlEncoder from 'plantuml-encoder';

// Shared slugify function for consistency between TOC and Anchors
export const slugify = (s: string) => 
  String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, ''); // Support Chinese and common chars

// Initialize markdown-it
export const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})
  .use(markdownItFootnote)
  .use(markdownItTaskLists)
  .use(markdownItAnchor, {
    slugify,
    permalink: false, // Don't add a link icon next to headers by default
  })
  .use(markdownItToc, {
    includeLevel: [1, 2, 3, 4, 5, 6],
    containerClass: 'table-of-contents',
    slugify,
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
