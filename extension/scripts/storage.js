/**
 * NotebookLM Enhancer - Storage Manager (Simplified for v1.8.6+)
 */
var StorageManager = {
  isContextValid() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  },

  async getEnabledState() {
    if (!this.isContextValid()) return true;
    try {
      const result = await chrome.storage.sync.get('nb_ext_enabled');
      return result.nb_ext_enabled !== false; 
    } catch (e) {
      return true;
    }
  },

  async setEnabledState(isEnabled) {
    if (this.isContextValid()) {
      await chrome.storage.sync.set({ 'nb_ext_enabled': isEnabled });
    }
  },

  async getDisplayMode() {
    if (!this.isContextValid()) return 'single';
    try {
      const result = await chrome.storage.local.get('nb_ext_display_mode');
      return result.nb_ext_display_mode || 'single';
    } catch (e) {
      return 'single';
    }
  },

  async setDisplayMode(mode) {
    if (this.isContextValid()) {
      await chrome.storage.local.set({ 'nb_ext_display_mode': mode });
    }
  },

  async getToolbarEnabled() {
    if (!this.isContextValid()) return true;
    try {
      const result = await chrome.storage.local.get('nb_ext_toolbar_enabled');
      return result.nb_ext_toolbar_enabled !== false;
    } catch (e) {
      return true;
    }
  },

  async setToolbarEnabled(isEnabled) {
    if (this.isContextValid()) {
      await chrome.storage.local.set({ 'nb_ext_toolbar_enabled': isEnabled });
    }
  }
};
