/**
 * NotebookLM Enhancer - Layout Engine (Native Focus)
 */
var LayoutEngine = {
  // Sync the floating shell position relative to the sidebar
  syncContainerSize(manager) {
    const shell = document.querySelector('.nb-ext-floating-shell');
    const scrollArea = document.querySelector('.scroll-area-desktop') || 
                       document.querySelector('.mat-drawer-inner-container') ||
                       document.querySelector('.source-panel-content');
    
    const isMainListView = ViewDetector.isMainListView(manager);
    const isNativeCollapsed = ViewDetector.isNativeCollapsed();

    if (scrollArea && isMainListView && !isNativeCollapsed) {
      const targetRect = scrollArea.getBoundingClientRect();
      
      if (shell) {
        shell.style.visibility = 'visible';
        shell.classList.remove('nb-ext-shell-collapsed');
        
        // Position shell over the sidebar
        shell.style.left = `${targetRect.left}px`;
        shell.style.width = `${targetRect.width}px`;
        shell.style.bottom = '24px';
        
        if (!ToolbarManager.isToolbarEnabled) {
          shell.classList.add('nb-ext-shell-mini');
          shell.style.width = '48px';
          shell.style.left = `${targetRect.left + 12}px`;
        } else {
          shell.classList.remove('nb-ext-shell-mini');
        }
      }
      
      // Ensure native scroll area is visible
      scrollArea.style.visibility = 'visible';
    } else {
      // Standby or Unsupported state
      if (shell) {
        shell.style.visibility = 'hidden';
        shell.classList.add('nb-ext-shell-collapsed');
      }
      if (scrollArea) {
        scrollArea.style.visibility = 'visible';
      }
    }
  },

  initSidebarObserver(manager, target) {
    if (manager.sidebarObserver) return;
    manager.sidebarObserver = new ResizeObserver(() => {
      this.syncContainerSize(manager);
    });
    manager.sidebarObserver.observe(target);
  }
};
