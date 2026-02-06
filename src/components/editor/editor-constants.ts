export const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  lineNumbers: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontFamily: '"Fira Code", monospace',
  fontSize: 13,
  stablePeek: true,
  // 禁用自动补全和提示
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  acceptSuggestionOnEnter: 'off' as const,
  tabCompletion: 'off' as const,
  parameterHints: { enabled: false },
  snippetSuggestions: 'none' as const,
  wordBasedSuggestions: 'off' as const,
  suggest: {
    showWords: false,
    showSnippets: false,
  },
  // 禁用自动闭合和自动环绕
  autoClosingBrackets: 'never' as const,
  autoClosingQuotes: 'never' as const,
  autoClosingOvertype: 'never' as const,
  autoSurround: 'never' as const,
  // 禁用键入时格式化
  formatOnType: false,
  formatOnPaste: false,
  // 禁用可能干扰输入的其他功能
  dragAndDrop: false,
  links: false,
  occurrencesHighlight: 'off' as const,
  selectionHighlight: false,
  // 优化中文输入体验
  unicodeHighlight: {
    ambiguousCharacters: false,
    invisibleCharacters: false,
  },
  // 保持稳定性
  scrollBeyondLastColumn: 0,
  overviewRulerLanes: 0,
};
