/**
 * NotebookLM Enhancer - Main Content Script (Native Focus)
 */
class NotebookManager {
  constructor() {
    this.sources = [];
    this.notebookId = this.extractNotebookId();
    this.isRendering = false;
    this.isSearchOpen = false;
    this.searchQuery = '';
    this.displayMode = 'single';
    this.lastUrl = window.location.href;
    this.isInitialized = false;

    this.init();
  }

  async init() {
    console.log("[NB-Ext] Initializing Enhancer (Native Mode)...");
    
    // Load persisted settings
    const data = await chrome.storage.local.get(['nb_ext_display_mode', 'nb_ext_toolbar_enabled']);
    if (data.nb_ext_display_mode) this.displayMode = data.nb_ext_display_mode;
    if (data.hasOwnProperty('nb_ext_toolbar_enabled')) {
      ToolbarManager.isToolbarEnabled = data.nb_ext_toolbar_enabled;
    }

    // Start lifecycle
    this.startObservers();
    this.scheduleRefresh([500, 1500, 3000]);
    
    this.isInitialized = true;
  }

  extractNotebookId() {
    const match = window.location.href.match(/\/notebook\/([^/?#]+)/);
    return match ? match[1] : null;
  }

  startObservers() {
    // 1. Navigation observer
    setInterval(() => {
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        const newId = this.extractNotebookId();
        if (newId !== this.notebookId) {
          console.log("[NB-Ext] Notebook switched:", newId);
          this.notebookId = newId;
          this.isSearchOpen = false;
          this.searchQuery = '';
          this.scheduleRefresh([500, 1000]);
        }
      }
    }, 1000);
    // 2. DOM Mutation observer for source list updates
    const observer = new MutationObserver((mutations) => {
      const shouldRefresh = mutations.some(m => 
        Array.from(m.addedNodes).some(n => n.nodeType === 1 && (
          n.matches?.('.mat-mdc-list-item, .mat-expansion-panel, .mat-tree-node, .cdk-tree-node, mat-checkbox, [role="listitem"]') || 
          n.querySelector?.('.mat-mdc-list-item, .mat-expansion-panel, .mat-tree-node, .cdk-tree-node, mat-checkbox, [role="listitem"]')
        ))
      );
      if (shouldRefresh) {
        this.scheduleRefresh([300]);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  scheduleRefresh(delays) {
    delays.forEach(ms => setTimeout(() => this.scanDom(), ms));
  }

  scanDom() {
    const scrollArea = document.querySelector('.scroll-area-desktop') || 
                       document.querySelector('.mat-drawer-inner-container') ||
                       document.querySelector('[class*="source-panel-content" i]') ||
                       document.querySelector('.source-panel-content') ||
                       document.querySelector('.mat-dialog-content') ||
                       document.querySelector('.mat-mdc-dialog-content');
    
    if (!scrollArea) return;

    if (typeof LayoutEngine !== 'undefined' && !this.sidebarObserver) {
      LayoutEngine.initSidebarObserver(this, scrollArea);
    }

    // Scraper logic to identify current sources
    const sourceElements = scrollArea.querySelectorAll('.source-stretched-button, button[class*="stretched-button"], [class*="source-item" i] button');
    
    this.sources = Array.from(sourceElements).map(el => {
      const parent = el.closest('.mat-mdc-list-item, .mat-list-item, [class*="source-item" i]') || el.parentElement;
      if (!parent) return null;

      const nameEl = parent.querySelector('.mdc-list-item__primary-text, .source-item-name, [class*="title" i], button[aria-label]');
      const name = (nameEl ? (nameEl.getAttribute('aria-label') || nameEl.textContent) : (el.getAttribute('aria-label') || el.textContent || "Unknown")).toString().trim();
      
      return {
        id: name, // Simplified ID since we aren't managing folders
        name: name,
        element: el
      };
    }).filter(s => s !== null);

    this.refreshData();
  }

  async refreshData(force = false) {
    if (force || !this.isRendering) {
      UIRenderer.renderSidebarUI(this);
    }
  }
}

// Global initialization
if (typeof window !== 'undefined') {
  window.nbManager = new NotebookManager();
}
