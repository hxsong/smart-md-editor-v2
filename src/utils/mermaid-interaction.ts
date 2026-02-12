
/**
 * Mermaid Diagram Interaction Utility
 * Provides zoom, pan, and reset functionality for Mermaid SVGs.
 */

export const MERMAID_INTERACTION_CSS = `
.mermaid-container {
  position: relative;
  overflow: hidden;
  cursor: default;
  background-color: transparent;
  border-radius: 8px;
  transition: background-color 0.2s;
  user-select: none;
  touch-action: none;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mermaid-container:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.dark .mermaid-container:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

.mermaid-container svg {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center center;
  cursor: grab;
}

.mermaid-container.dragging svg {
  cursor: grabbing;
  transition: none;
}

.mermaid-toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  padding: 4px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  opacity: 0;
  transition: opacity 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dark .mermaid-toolbar {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mermaid-container:hover .mermaid-toolbar {
  opacity: 1;
}

.mermaid-tool-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #475569;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .mermaid-tool-btn {
  color: #94a3b8;
}

.mermaid-tool-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #2563eb;
}

.dark .mermaid-tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #60a5fa;
}

.mermaid-zoom-info {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  padding: 0 4px;
  min-width: 40px;
  justify-content: center;
}

.mermaid-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 5;
}

.mermaid-container:hover .mermaid-hint {
  opacity: 1;
}
`;

/**
 * Core logic for applying interactions to a mermaid container.
 * This function is shared between the preview and exported HTML.
 */
const applyInteractions = (container: HTMLElement) => {
  if (container.hasAttribute('data-mermaid-initialized')) return;
  container.setAttribute('data-mermaid-initialized', 'true');

  const svg = container.querySelector('svg') as SVGSVGElement | null;
  if (!svg) return;

  svg.style.transformOrigin = 'center center';
  
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let isSpacePressed = false;
  let startX: number, startY: number;

  // Add toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'mermaid-toolbar';
  toolbar.innerHTML = `
    <div class="mermaid-zoom-info">100%</div>
    <button class="mermaid-tool-btn zoom-in" title="放大 (Ctrl + 滚轮)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
    </button>
    <button class="mermaid-tool-btn zoom-out" title="缩小 (Ctrl + 滚轮)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
    </button>
    <button class="mermaid-tool-btn reset" title="重置">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
    </button>
  `;
  container.appendChild(toolbar);

  // Add hint
  const hint = document.createElement('div');
  hint.className = 'mermaid-hint';
  hint.textContent = '滚轮缩放 | 拖拽移动 | 点击重置';
  container.appendChild(hint);

  const zoomInfo = toolbar.querySelector('.mermaid-zoom-info');

  const updateTransform = (animate = true) => {
    if (!animate) {
      svg.style.transition = 'none';
    } else {
      svg.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    if (zoomInfo) zoomInfo.textContent = `${Math.round(scale * 100)}%`;
    
    const id = container.getAttribute('data-line') || 'default';
    localStorage.setItem(`mermaid-state-${id}`, JSON.stringify({ scale, translateX, translateY }));
  };

  const zoom = (delta: number, clientX?: number, clientY?: number) => {
    const prevScale = scale;
    scale += delta;
    scale = Math.min(Math.max(0.5, scale), 5);

    if (clientX !== undefined && clientY !== undefined) {
      const rect = svg.getBoundingClientRect();
      const offsetX = (clientX - (rect.left + rect.width / 2)) / prevScale;
      const offsetY = (clientY - (rect.top + rect.height / 2)) / prevScale;
      
      translateX -= offsetX * (scale - prevScale);
      translateY -= offsetY * (scale - prevScale);
    }

    updateTransform();
  };

  const reset = () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateTransform(true);
  };

  // Load saved state
  const id = container.getAttribute('data-line') || 'default';
  const saved = localStorage.getItem(`mermaid-state-${id}`);
  if (saved) {
    try {
      const { scale: s, translateX: tx, translateY: ty } = JSON.parse(saved);
      scale = s; translateX = tx; translateY = ty;
      updateTransform(false);
    } catch (e) {}
  }

  // Event Listeners
  container.addEventListener('wheel', (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoom(delta, e.clientX, e.clientY);
    }
  }, { passive: false });

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    
    const containerRect = container.getBoundingClientRect();
    const svgBBox = svg.getBBox ? svg.getBBox() : { width: svg.clientWidth, height: svg.clientHeight };
    const padding = 40; 
    
    const limitX = (svgBBox.width * scale) / 2 + containerRect.width / 2 - padding;
    const limitY = (svgBBox.height * scale) / 2 + containerRect.height / 2 - padding;
    
    translateX = Math.min(Math.max(translateX, -limitX), limitX);
    translateY = Math.min(Math.max(translateY, -limitY), limitY);
    
    updateTransform(false);
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      container.classList.remove('dragging');
      if (!isSpacePressed) {
        container.style.cursor = 'default';
      }
      updateTransform(true);
      
      // Remove temporary global listeners
      window.removeEventListener('mousemove', onMouseMove as any);
      window.removeEventListener('mouseup', onMouseUp);
    }
  };

  container.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button !== 0) return;
    isDragging = true;
    container.classList.add('dragging');
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    svg.style.transition = 'none';
    
    // Add temporary global listeners for smooth dragging outside container
    window.addEventListener('mousemove', onMouseMove as any);
    window.addEventListener('mouseup', onMouseUp);
  });

  // container.addEventListener('dblclick', reset);

  const btnIn = toolbar.querySelector('.zoom-in');
  const btnOut = toolbar.querySelector('.zoom-out');
  const btnReset = toolbar.querySelector('.reset');
  
  if (btnIn) btnIn.addEventListener('click', () => zoom(0.1));
  if (btnOut) btnOut.addEventListener('click', () => zoom(-0.1));
  if (btnReset) btnReset.addEventListener('click', reset);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && document.activeElement && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (!isSpacePressed) {
        isSpacePressed = true;
        container.style.cursor = 'grab';
        if (e.target === document.body || e.target === container) {
          e.preventDefault();
        }
      }
    }
  };
  
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      isSpacePressed = false;
      if (!isDragging) {
        container.style.cursor = 'default';
      }
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
};

/**
 * Initializes interactions for all mermaid containers in the current document.
 * This can be called multiple times; it will skip already initialized containers.
 */
export const initMermaidInteractions = (root: HTMLElement | Document = document) => {
  const containers = root.querySelectorAll('.mermaid-container');
  containers.forEach(container => applyInteractions(container as HTMLElement));
};

/**
 * Stringified version of the initialization logic for injection into exported HTML.
 */
export const MERMAID_INTERACTION_JS = `
(function() {
  const applyInteractions = ${applyInteractions.toString()};
  
  function initMermaidInteractions(root = document) {
    const containers = root.querySelectorAll('.mermaid-container');
    containers.forEach(container => applyInteractions(container));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initMermaidInteractions());
  } else {
    initMermaidInteractions();
  }
  
  window.initMermaidInteractions = initMermaidInteractions;
})();
`;
