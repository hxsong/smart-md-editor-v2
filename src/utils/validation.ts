
export const validateContent = (content: string): string | null => {
  // Check for unclosed code blocks
  const codeBlockCount = (content.match(/^```/gm) || []).length;
  if (codeBlockCount % 2 !== 0) {
    return '发现未闭合的代码块 (```)。请在保存前闭合所有代码块。';
  }

  // Check for empty Mermaid diagram blocks
  const mermaidBlocks = content.match(/```mermaid([\s\S]*?)```/g);
  if (mermaidBlocks) {
    for (const block of mermaidBlocks) {
      if (block.replace(/```mermaid|```|\s/g, '').length === 0) {
         return '发现空的 Mermaid 图表块。';
      }
    }
  }

  return null;
};
