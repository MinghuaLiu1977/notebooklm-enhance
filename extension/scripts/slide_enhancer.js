/**
 * NotebookLM Slide Enhancer
 * 负责在 Studio 面板原生菜单中注入导出增强入口，并对接 NetworkInterceptor。
 */

var SlideEnhancer = {
  init() {
    console.log("[NB-Ext] SlideEnhancer: 启动 Artifact Hover 增强...");
    ArtifactHoverInjector.init();
  }
};

/**
 * 监听所有 Artifact 卡片，并在 Hover 时注入悬浮导出按钮
 */
var ArtifactHoverInjector = {
  init() {
    console.log("[NB-Ext] ArtifactHoverInjector: 启动 Hover 监测...");
    this.observer = new MutationObserver(() => this.scanAndBind());
    this.observer.observe(document.body, { childList: true, subtree: true });
    this.scanAndBind();
  },

  scanAndBind() {
    // 目标：NotebookLM 的各种文档卡片和预览按钮
    const selectors = [
      '.artifact-item-button',
      'button[aria-labelledby^="artifact-labels-"]',
      '.mat-mdc-card'
    ];
    
    document.querySelectorAll(selectors.join(',')).forEach(el => {
      // 这里的 container 是我们要钉上按钮的物理目标
      const container = el.closest('.artifact-item-button') || el.closest('.mat-mdc-card') || el;
      if (container.getAttribute('data-nb-ext-hover-injected')) return;
      
      container.setAttribute('data-nb-ext-hover-injected', 'true');
      container.style.position = 'relative'; // 确保子绝父相

      container.addEventListener('mouseenter', () => this.showButton(container));
      container.addEventListener('mouseleave', () => this.hideButton(container));
    });
  },

  showButton(container) {
    if (container.querySelector('.nb-ext-hover-btn')) {
      container.querySelector('.nb-ext-hover-btn').style.opacity = '1';
      return;
    }

    // 提取当前卡片的物理 ID
    const labelEl = container.querySelector('[aria-labelledby^="artifact-labels-"]') || container;
    const attr = labelEl.getAttribute('aria-labelledby');
    if (!attr || !attr.startsWith('artifact-labels-')) return;
    
    const artifactId = attr.replace('artifact-labels-', '');

    const btn = document.createElement('div');
    btn.className = 'nb-ext-hover-btn';
    btn.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 18px;">magic_button</span>
      <span style="font-size: 11px; margin-left: 4px; font-weight: bold;">PPT 导出</span>
    `;

    // 样式：悬浮在右上角，醒目的蓝色
    Object.assign(btn.style, {
      position: 'absolute',
      top: '4px',
      right: '4px',
      zIndex: '2000',
      backgroundColor: '#1a73e8',
      color: '#fff',
      padding: '4px 8px',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(26,115,232,0.4)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: '1',
      pointerEvents: 'auto'
    });

    btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; btn.style.backgroundColor = '#1557b0'; };
    btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.backgroundColor = '#1a73e8'; };

    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log(`[NB-Ext] 🖱️ 用户点击悬浮按钮 | 物理锁定 Artifact: ${artifactId}`);
      NetworkInterceptor.startExportProcess(artifactId);
    };

    container.appendChild(btn);
  },

  hideButton(container) {
    const btn = container.querySelector('.nb-ext-hover-btn');
    if (btn) btn.style.opacity = '0';
  }
};

setTimeout(() => SlideEnhancer.init(), 2500);
