/**
 * NotebookLM Enhancer - Toolbar Manager (Native Focus + SVG Icons)
 */
var ToolbarManager = {
  isToolbarEnabled: true,

  // SVG Icons
  icons: {
    search: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    single: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>`,
    double: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 15h16v-2H4v2zm0 4h16v-2H4v2zm0-8h16V9H4v2zm0-6v2h16V5H4z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
    checkAll: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>`
  },

  async initToolbar(manager) {
    let shell = document.querySelector('.nb-ext-floating-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.className = 'nb-ext-floating-shell';
      document.body.appendChild(shell);
    }

    shell.textContent = '';
    
    if (!this.isToolbarEnabled) {
      shell.classList.add('nb-ext-shell-mini');
      // Shrunk state: Render single expand button
      const expandBtn = document.createElement('button');
      expandBtn.className = 'nb-ext-btn-icon nb-ext-btn-expand';
      expandBtn.innerHTML = this.icons.chevronRight;
      expandBtn.title = 'Expand Toolbar';
      expandBtn.onclick = () => {
        this.isToolbarEnabled = true;
        chrome.storage.local.set({ 'nb_ext_toolbar_enabled': true });
        manager.refreshData(true);
      };
      shell.appendChild(expandBtn);
      return;
    }

    shell.classList.remove('nb-ext-shell-mini');
    // Create Main Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'nb-ext-toolbar';

    this.renderButtons(manager, toolbar);
    
    if (manager.isSearchOpen) {
      toolbar.style.setProperty('display', 'none', 'important');
    }
    shell.appendChild(toolbar);

    // Create Search Panel
    if (manager.isSearchOpen) {
      const searchPanel = this.renderSearchPanel(manager);
      shell.appendChild(searchPanel);
    }
  },

  renderButtons(manager, toolbar) {
    // 1. Search Button
    const searchBtn = document.createElement('button');
    searchBtn.className = `nb-ext-btn-icon ${manager.isSearchOpen ? 'nb-ext-btn-active' : ''}`;
    searchBtn.innerHTML = this.icons.search;
    searchBtn.title = 'Search Sources';
    searchBtn.onclick = () => {
      manager.isSearchOpen = !manager.isSearchOpen;
      if (manager.isSearchOpen) {
        manager.searchQuery = ''; // Reset on open
      }
      manager.refreshData(true);
    };
    toolbar.appendChild(searchBtn);

    // 2. Display Mode Button
    const modeBtn = document.createElement('button');
    modeBtn.className = 'nb-ext-btn-icon';
    const isDouble = manager.displayMode === 'double';
    modeBtn.innerHTML = isDouble ? this.icons.single : this.icons.double;
    modeBtn.title = isDouble ? 'Switch to Single Line' : 'Switch to Double Line';
    modeBtn.onclick = () => {
      manager.displayMode = isDouble ? 'single' : 'double';
      chrome.storage.local.set({ 'nb_ext_display_mode': manager.displayMode });
      manager.refreshData(true);
    };
    toolbar.appendChild(modeBtn);

    // 3. Shrink Button
    const shrinkBtn = document.createElement('button');
    shrinkBtn.className = 'nb-ext-btn-icon';
    shrinkBtn.innerHTML = this.icons.chevronLeft;
    shrinkBtn.title = 'Shrink Toolbar';
    shrinkBtn.onclick = () => {
      this.isToolbarEnabled = false;
      chrome.storage.local.set({ 'nb_ext_toolbar_enabled': false });
      manager.refreshData(true);
    };
    toolbar.appendChild(shrinkBtn);
  },

  renderSearchPanel(manager) {
    const panel = document.createElement('div');
    panel.className = 'nb-ext-search-panel';

    const wrapper = document.createElement('div');
    wrapper.className = 'nb-ext-search-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'nb-ext-search-input';
    input.placeholder = 'Search sources...';
    input.value = manager.searchQuery;
    
    input.addEventListener('input', (e) => {
      manager.searchQuery = e.target.value;
      UIRenderer.applyFilter(manager);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        manager.isSearchOpen = false;
        manager.refreshData(true);
      }
    });

    const clear = document.createElement('span');
    clear.className = 'nb-ext-search-clear';
    clear.innerHTML = this.icons.close;
    clear.title = 'Clear/Close Search';
    clear.onclick = () => {
      if (input.value) {
        manager.searchQuery = '';
        input.value = '';
        input.focus();
        UIRenderer.applyFilter(manager);
      } else {
        manager.isSearchOpen = false;
        manager.refreshData(true);
      }
    };

    const selectAllBtn = document.createElement('span');
    selectAllBtn.className = 'nb-ext-search-select-all';
    selectAllBtn.innerHTML = this.icons.checkAll;
    selectAllBtn.title = 'Select All Matching Sources';
    selectAllBtn.onclick = () => {
      UIRenderer.selectAllVisible();
    };

    wrapper.append(input, selectAllBtn, clear);

    const info = document.createElement('div');
    info.className = 'nb-ext-search-info';
    info.textContent = 'Use + for AND search';

    panel.append(wrapper, info);

    setTimeout(() => input.focus(), 50);
    return panel;
  }
};

if (typeof window !== 'undefined') window.ToolbarManager = ToolbarManager;
