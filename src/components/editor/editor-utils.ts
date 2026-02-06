/**
 * 定位预览区到指定行号，并与点击位置垂直对齐
 */
export const scrollToPreviewLine = (
  lineNumber: number,
  clickY: number,
  previewElement: HTMLElement | null
) => {
  if (!previewElement) return;

  const targetLine = lineNumber - 1; // data-line is 0-indexed

  // 1. 获取预览区内所有的 data-line 元素
  const elements = Array.from(previewElement.querySelectorAll('[data-line]')) as HTMLElement[];
  if (elements.length === 0) return;

  // 2. 寻找最合适的匹配元素（向下寻踪）
  let bestMatch: HTMLElement | null = null;
  let minDiff = Infinity;

  elements.forEach((el) => {
    const line = parseInt(el.getAttribute('data-line') || '-1');
    if (line === -1) return;

    if (line === targetLine) {
      bestMatch = el;
      minDiff = 0;
    } else if (line < targetLine) {
      const diff = targetLine - line;
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = el;
      }
    }
  });

  // 3. 执行垂直对齐定位
  if (bestMatch) {
    let target = bestMatch as HTMLElement;
    let targetRect = target.getBoundingClientRect();
    let scrollOffset = targetRect.top - clickY;

    // 4. 精确化定位：如果 target 是一个容器（如 table 或 mermaid），且 targetLine 在其范围内
    const lineStart = parseInt(target.getAttribute('data-line') || '-1');
    const lineEnd = parseInt(target.getAttribute('data-line-end') || '-1');

    if (lineEnd > lineStart && targetLine > lineStart && targetLine < lineEnd) {
      // 尝试在容器内寻找更精确的行（如 tr）
      const subMatch = Array.from(target.querySelectorAll(`[data-line="${targetLine}"]`)) as HTMLElement[];
      if (subMatch.length > 0) {
        target = subMatch[0];
        targetRect = target.getBoundingClientRect();
        scrollOffset = targetRect.top - clickY;
      } else {
        // 如果没找到精确的子元素（如 mermaid 或 code block），则按比例插值
        const totalLines = lineEnd - lineStart;
        const currentLineOffset = targetLine - lineStart;
        const percentage = currentLineOffset / totalLines;

        const blockHeight = targetRect.height;
        const internalOffset = blockHeight * percentage;
        scrollOffset = targetRect.top + internalOffset - clickY;
      }
    }

    // 最终滚动位置 = 当前 scrollTop + 偏移量
    const finalScrollTop = previewElement.scrollTop + scrollOffset;

    previewElement.scrollTo({
      top: Math.max(0, finalScrollTop),
      behavior: 'smooth',
    });

    // 添加短暂的高亮反馈
    target.style.transition = 'background-color 0.3s';
    const originalBg = target.style.backgroundColor;
    target.style.backgroundColor = 'rgba(255, 251, 220, 0.7)';
    setTimeout(() => {
      target.style.backgroundColor = originalBg;
    }, 1000);
  }
};

/**
 * 获取上下文信息
 */
export const getContextInfo = (range: Range | null) => {
  if (!range) return { sentence: '', heading: '', lineHint: -1 };

  const container = range.startContainer;
  const offset = range.startOffset;

  // 1. Get Sentence
  let sentence = '';
  if (container.nodeType === Node.TEXT_NODE) {
    const content = container.textContent || '';
    let start = offset;
    while (start > 0 && !/[。？！.!?\n]/.test(content[start - 1])) start--;
    let end = offset;
    while (end < content.length && !/[。？！.!?\n]/.test(content[end])) end++;
    sentence = content.substring(start, end).trim();
  }

  // 2. Get Heading and Line Hint
  let heading = '';
  let lineHint = -1;
  let el: Element | null = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : container.parentElement;

  // Find nearest parent with data-line
  let currForLine: Element | null = el;
  while (currForLine && !currForLine.hasAttribute('data-line')) {
    currForLine = currForLine.parentElement;
    if (currForLine && currForLine.classList.contains('prose')) break;
  }
  if (currForLine && currForLine.hasAttribute('data-line')) {
    lineHint = parseInt(currForLine.getAttribute('data-line') || '-1', 10);
  }

  // Find nearest preceding heading
  const allElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, li, pre, .mermaid-container'));

  let searchStartEl = el;
  while (searchStartEl && !allElements.includes(searchStartEl)) {
    searchStartEl = searchStartEl.parentElement;
  }

  const myIndex = searchStartEl ? allElements.indexOf(searchStartEl) : -1;

  if (myIndex !== -1) {
    for (let i = myIndex; i >= 0; i--) {
      const el = allElements[i];
      if (/^H[1-6]$/i.test(el.tagName)) {
        heading = el.textContent?.trim() || '';
        break;
      }
    }
  }

  return { sentence, heading, lineHint };
};

/**
 * 转义正则字符
 */
export const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 执行搜索并高亮
 */
export const performSearchAndHighlight = (
  text: string,
  editor: any,
  highlightDecorations: React.MutableRefObject<string[]>,
  isProgrammaticScroll: React.MutableRefObject<boolean>,
  sentence?: string,
  heading?: string,
  lineHint?: number
) => {
  if (!text || !editor) return;

  const model = editor.getModel();
  if (!model) return;

  let startLine = 1;
  let endLine = model.getLineCount();

  // 1. Use heading to narrow down the range
  if (heading) {
    const headingMatches = model.findMatches(escapeRegExp(heading), false, false, false, null, true);
    if (headingMatches.length > 0) {
      startLine = headingMatches[0].range.startLineNumber;
      // Try to find the next heading to define the end of the range
      const nextHeadingMatches = model.findMatches('^#+\\s+', true, true, false, null, true);
      const nextHeading = nextHeadingMatches.find((m: any) => m.range.startLineNumber > startLine);
      if (nextHeading) {
        endLine = nextHeading.range.startLineNumber;
      }
    }
  }

  // 2. If we have a lineHint from data-line, and it's within our heading range, use it to narrow further
  if (lineHint !== undefined && lineHint !== -1) {
    const adjustedLine = lineHint + 1; // data-line is 0-indexed, monaco is 1-indexed
    if (adjustedLine >= startLine && adjustedLine <= endLine) {
      startLine = adjustedLine;
    }
  }

  const rangeToSearch = {
    startLineNumber: startLine,
    startColumn: 1,
    endLineNumber: endLine,
    endColumn: model.getLineMaxColumn(endLine),
  };

  // 3. Try to find the sentence within the range
  let bestMatch = null;
  if (sentence && sentence.length > 5) {
    const sentenceMatches = model.findMatches(escapeRegExp(sentence), rangeToSearch, false, false, null, true);
    if (sentenceMatches.length > 0) {
      bestMatch = sentenceMatches[0];
    }
  }

  // 4. If sentence not found, search for the text within the range
  if (!bestMatch) {
    const matches = model.findMatches(escapeRegExp(text), rangeToSearch, false, false, null, true);
    if (matches.length > 0) {
      bestMatch = matches[0];
    }
  }

  // 5. Fallback: if not found in range, search entire document
  if (!bestMatch) {
    const matches = model.findMatches(escapeRegExp(text), false, false, false, null, true);
    if (matches.length > 0) {
      // Closest to center
      const visibleRanges = editor.getVisibleRanges();
      if (visibleRanges.length > 0) {
        const centerLine = (visibleRanges[0].startLineNumber + visibleRanges[0].endLineNumber) / 2;
        let minDistance = Infinity;
        for (const match of matches) {
          const distance = Math.abs(match.range.startLineNumber - centerLine);
          if (distance < minDistance) {
            minDistance = distance;
            bestMatch = match;
          }
        }
      } else {
        bestMatch = matches[0];
      }
    }
  }

  if (bestMatch) {
    isProgrammaticScroll.current = true;
    editor.revealRangeInCenter(bestMatch.range);
    editor.setSelection(bestMatch.range);

    // 重置标志位，延迟时间需覆盖编辑器滚动动画时间
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 500);

    const newDecorations = [
      {
        range: bestMatch.range,
        options: {
          isWholeLine: false,
          className: 'text-highlight-bg',
          inlineClassName: 'text-highlight-text',
          hoverMessage: { value: '从预览区域匹配' },
        },
      },
    ];

    highlightDecorations.current = editor.deltaDecorations(highlightDecorations.current, newDecorations);

    setTimeout(() => {
      if (editor) {
        highlightDecorations.current = editor.deltaDecorations(highlightDecorations.current, []);
      }
    }, 1500);
  }
};
