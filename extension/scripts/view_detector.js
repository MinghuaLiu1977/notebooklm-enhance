/**
 * NotebookLM Enhancer - View Detector
 * Optimized for robust view state detection based on user-defined visibility rules.
 */
var ViewDetector = {
  /**
   * Check if we are currently in the main list view (Sources sidebar visible)
   */
  isMainListView() {
    // Characterize the main list by its scroll containers
    const scrollArea = document.querySelector('.scroll-area-desktop') || 
                       document.querySelector('.mat-drawer-inner-container') ||
                       document.querySelector('[class*="source-panel-content" i]');
    
    // A visible scroll area usually means we are in the main list
    const result = !!(scrollArea && (scrollArea.offsetWidth > 0 || scrollArea.offsetHeight > 0));
    return result;
  },

  /**
   * Check if the sidebar is natively collapsed or hidden
   * Rule: Hide if 'source-panel panel-collapsed' or similar state is present
   */
  isNativeCollapsed() {
    const sidebar = document.querySelector('.mat-drawer') || 
                    document.querySelector('.source-panel') ||
                    document.querySelector('[class*="source-panel" i]') || 
                    document.querySelector('.scroll-area-desktop');

    if (!sidebar) return true;

    // 1. Check for explicit collapse classes (user specified 'panel-collapsed')
    const hasCollapsedClass = sidebar.classList.contains('panel-collapsed') || 
                               sidebar.classList.contains('collapsed') ||
                               document.querySelector('.panel-header-collapsed') ||
                               document.body.classList.contains('nb-ext-is-collapsed');

    // 2. Physical check for robustness
    const isNarrow = sidebar.offsetWidth > 0 && sidebar.offsetWidth < 100;

    return !!(hasCollapsedClass || isNarrow);
  },

  /**
   * Check if we are currently in a view that should HIDE the toolbar
   * Rules: Hide if '.source-panel-view-content' or 'aria-modal="true"' is present.
   */
  isDocumentView() {
    const isNotebook = window.location.href.includes('/notebook/');
    if (!isNotebook) return false;

    // 1. Rule: Hide if Source detail is expanded
    const hasSourceViewContent = !!document.querySelector('.source-panel-view-content');
    
    // 2. Rule: Hide if any modal is active (Artifacts, Slide Decks, Infographics usually use this)
    const hasAriaModal = !!document.querySelector('[aria-modal="true"]');

    // 3. Fallback: Specific Studio/Document tags that might not use aria-modal
    const hasSpecialViewer = !!document.querySelector('lb-source-viewer, lb-note-viewer, lb-slide-deck, lb-mind-map, lb-artifact-viewer');
    
    const result = hasSourceViewContent || hasAriaModal || hasSpecialViewer;
    
    if (result) {
      console.log("[NB-Ext] Hide triggered via:", { hasSourceViewContent, hasAriaModal, hasSpecialViewer });
    }
    return result;
  }
};
