
export const validateContent = (content: string): string | null => {
  // Check for unclosed code blocks
  const codeBlockCount = (content.match(/^```/gm) || []).length;
  if (codeBlockCount % 2 !== 0) {
    return 'Found unclosed code blocks (```). Please close all code blocks before saving.';
  }

  // Check for empty Mermaid diagram blocks
  const mermaidBlocks = content.match(/```mermaid([\s\S]*?)```/g);
  if (mermaidBlocks) {
    for (const block of mermaidBlocks) {
      if (block.replace(/```mermaid|```|\s/g, '').length === 0) {
         return 'Found empty Mermaid diagram block.';
      }
    }
  }

  return null;
};
