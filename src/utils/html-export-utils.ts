
/**
 * Utility for exporting Markdown content to a self-contained HTML file.
 */

interface ExportOptions {
  title?: string;
  theme?: 'light' | 'dark';
  onProgress?: (progress: number) => void;
}

/**
 * Converts a URL to a base64 string.
 */
const toBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Error converting image to base64:', url, e);
    return url; // Fallback to original URL
  }
};

/**
 * Localizes all images in the HTML by converting them to base64.
 */
const localizeImages = async (html: string, onProgress?: (p: number) => void): Promise<string> => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const images = Array.from(div.querySelectorAll('img'));
  const total = images.length;

  if (total === 0) {
    onProgress?.(100);
    return div.innerHTML;
  }

  for (let i = 0; i < total; i++) {
    const img = images[i];
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      const base64 = await toBase64(src);
      img.setAttribute('src', base64);
    }
    onProgress?.(Math.round(((i + 1) / total) * 100));
  }

  return div.innerHTML;
};

/**
 * Gets all active stylesheets in the current document and returns them as a single string.
 */
const getStyles = (): string => {
  let styles = '';
  try {
    const styleSheets = Array.from(document.styleSheets);
    for (const sheet of styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules);
        for (const rule of rules) {
          styles += rule.cssText + '\n';
        }
      } catch (e) {
        // Skip cross-origin stylesheets that we can't access
        console.warn('Could not access stylesheet:', sheet.href, e);
        if (sheet.href) {
          styles += `@import url("${sheet.href}");\n`;
        }
      }
    }
  } catch (e) {
    console.error('Error gathering styles:', e);
  }
  return styles;
};

/**
 * Generates a full, self-contained HTML document string.
 */
export const generateHTML = async (
  contentHtml: string,
  options: ExportOptions = {}
): Promise<string> => {
  const { title = 'Exported Document', theme = 'light', onProgress } = options;
  const styles = getStyles();
  
  // Localize images with progress reporting
  onProgress?.(0);
  const localizedContent = await localizeImages(contentHtml, (p) => {
    // We reserve 90% for image localization, 10% for final assembly
    onProgress?.(Math.round(p * 0.9));
  });

  onProgress?.(95);

  // CDNs for external dependencies
  const katexCss = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
  const mermaidJs = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
  const echartsJs = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
  const tablesortJs = 'https://cdn.jsdelivr.net/npm/tablesort@5.2.1/dist/tablesort.min.js';

  const html = `<!DOCTYPE html>
<html lang="en" class="${theme}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="${katexCss}">
    <style>
        ${styles}
        :root {
            --primary-600: #2563eb;
            --primary-700: #1d4ed8;
            --secondary-50: #f8fafc;
            --secondary-100: #f1f5f9;
            --secondary-200: #e2e8f0;
            --secondary-300: #cbd5e1;
            --secondary-400: #94a3b8;
            --secondary-500: #64748b;
            --secondary-600: #475569;
            --secondary-700: #334155;
            --secondary-800: #1e293b;
            --secondary-900: #0f172a;
        }

        body {
            margin: 0;
            padding: 0;
            background-color: ${theme === 'dark' ? 'var(--secondary-900)' : 'var(--secondary-50)'};
            color: ${theme === 'dark' ? 'var(--secondary-200)' : 'var(--secondary-800)'};
            font-size: 0.875rem; /* Reduced from default 1rem */
            line-height: 1.75;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        
        /* Reset app-specific styles that prevent scrolling */
        html, body, #root {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
        }

        .markdown-body {
            max-width: 90%; /* Adjusted from 896px */
            margin: 0 auto;
            padding: 2rem 1.5rem;
            background-color: ${theme === 'dark' ? 'var(--secondary-900)' : '#ffffff'};
            min-height: 100vh;
            box-sizing: border-box;
        }

        @media (min-width: 768px) {
            .markdown-body {
                padding: 3rem 4rem;
            }
        }

        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {
            font-weight: 700;
            margin-top: 1.5rem;
            margin-bottom: 1rem;
            color: ${theme === 'dark' ? 'var(--secondary-100)' : 'var(--secondary-900)'};
            line-height: 1.25;
        }

        .markdown-body h1 { 
            font-size: 1.875rem; 
            border-bottom: 1px solid ${theme === 'dark' ? 'var(--secondary-700)' : 'var(--secondary-200)'}; 
            padding-bottom: 0.5rem; 
            margin-top: 0;
        }
        .markdown-body h2 { 
            font-size: 1.5rem; 
            border-bottom: 1px solid ${theme === 'dark' ? 'var(--secondary-700)' : 'var(--secondary-200)'}; 
            padding-bottom: 0.5rem; 
        }
        .markdown-body h3 { font-size: 1.25rem; }
        .markdown-body h4 { font-size: 1.125rem; }
        .markdown-body h5 { font-size: 1rem; }
        .markdown-body h6 { font-size: 0.875rem; }

        .markdown-body p { margin-bottom: 1rem; leading-height: 1.75; }
        .markdown-body ul { list-style-type: disc; margin-bottom: 1rem; padding-left: 1.5rem; }
        .markdown-body ol { list-style-type: decimal; margin-bottom: 1rem; padding-left: 1.5rem; }
        .markdown-body li { margin-bottom: 0.25rem; }

        .markdown-body code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.875rem;
            background-color: ${theme === 'dark' ? 'var(--secondary-800)' : 'var(--secondary-100)'};
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
        }

        .markdown-body pre {
            background-color: ${theme === 'dark' ? 'var(--secondary-800)' : 'var(--secondary-100)'};
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin-bottom: 1rem;
        }

        .markdown-body pre code {
            background-color: transparent;
            padding: 0;
            color: ${theme === 'dark' ? 'var(--secondary-200)' : 'var(--secondary-800)'};
        }

        .markdown-body blockquote {
            border-left: 4px solid ${theme === 'dark' ? 'var(--secondary-600)' : 'var(--secondary-300)'};
            padding-left: 1rem;
            color: ${theme === 'dark' ? 'var(--secondary-400)' : 'var(--secondary-600)'};
            font-style: italic;
            margin-bottom: 1rem;
        }

        /* Table Styling - Matching Preview */
        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
        }
        .markdown-body th, .markdown-body td {
            border: 1px solid ${theme === 'dark' ? 'var(--secondary-800)' : 'var(--secondary-200)'};
            padding: 0.5rem 0.75rem;
        }
        .markdown-body th {
            background-color: ${theme === 'dark' ? 'var(--secondary-900)' : 'var(--secondary-50)'};
            font-weight: 700;
        }
        
        .markdown-body img {
            max-width: 100%;
            height: auto;
            border-radius: 0.25rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            margin: 1rem 0;
        }

        .markdown-body hr {
            border: 0;
            border-top: 1px solid ${theme === 'dark' ? 'var(--secondary-700)' : 'var(--secondary-300)'};
            margin: 2rem 0;
        }

        .markdown-body a {
            color: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
            text-decoration: none;
        }
        .markdown-body a:hover {
            text-decoration: underline;
        }

        /* Override some preview-only styles */
        .pdf-export-container { display: none; }
        .line-numbers { display: none; }
        .copy-button { display: none; }
        .image-container { background: none !important; padding: 0 !important; }
        
        /* Ensure charts and diagrams are visible */
        .echarts-chart { min-height: 400px; width: 100%; margin: 1.5rem 0; }
        .mermaid-container { display: flex; justify-content: center; margin: 1.5rem 0; }
        
        /* Back to Top Button */
        #back-to-top {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background-color: #2563eb;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            transition: all 0.3s;
            opacity: 0;
            visibility: hidden;
            border: none;
            outline: none;
            z-index: 1000;
        }
        #back-to-top.show {
            opacity: 1;
            visibility: visible;
        }
        #back-to-top:hover {
            background-color: #1d4ed8;
            transform: scale(1.05);
        }
        
        @media print {
            body { padding: 0; background: white; color: black; }
            .no-print { display: none; }
        }
    </style>
</head>
<body class="markdown-body">
    <div id="content">
        ${localizedContent}
    </div>

    <button id="back-to-top" title="Back to Top">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
    </button>

    <!-- External Scripts -->
    <script src="${mermaidJs}"></script>
    <script src="${echartsJs}"></script>
    <script src="${tablesortJs}"></script>

    <script>
        // Initialize Mermaid
        mermaid.initialize({ startOnLoad: true, theme: '${theme === 'dark' ? 'dark' : 'default'}' });

        // Initialize ECharts
        function initCharts() {
            const chartContainers = document.querySelectorAll('.echarts-chart');
            chartContainers.forEach((container) => {
                const script = container.querySelector('script');
                if (script && script.textContent) {
                    try {
                        const option = JSON.parse(script.textContent);
                        const chart = echarts.init(container);
                        chart.setOption(option);
                        
                        window.addEventListener('resize', () => {
                            chart.resize();
                        });
                    } catch (e) {
                        console.error('ECharts render error:', e);
                    }
                }
            });
        }

        // Initialize Tablesort
        function initTableSort() {
            const tables = document.querySelectorAll('table');
            tables.forEach((table) => {
                new Tablesort(table);
            });
        }

        // Run initializations
        document.addEventListener('DOMContentLoaded', () => {
            initCharts();
            initTableSort();

            // Handle TOC and internal link clicks without changing URL hash
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a');
                if (target && target.hash && target.hash.startsWith('#')) {
                    const id = decodeURIComponent(target.hash.slice(1));
                    const element = document.getElementById(id) || document.getElementsByName(id)[0];
                    
                    if (element) {
                        e.preventDefault();
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });

            // Back to Top Logic
            const backToTop = document.getElementById('back-to-top');
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTop.classList.add('show');
                } else {
                    backToTop.classList.remove('show');
                }
            });

            backToTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        });
    </script>
</body>
</html>`;

  onProgress?.(100);
  return html;
};

/**
 * Triggers a file download in the browser.
 */
export const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Directly downloads the HTML content as a file.
 */
export const saveHTMLFile = async (content: string, defaultFileName: string) => {
  downloadFile(content, defaultFileName, 'text/html');
  return true;
};
