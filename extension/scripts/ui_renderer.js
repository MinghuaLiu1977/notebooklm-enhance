const UIRenderer = {
  async renderSidebarUI(manager) {
    if (manager.isRendering) return;
    manager.isRendering = true;
    try {
      if (manager.displayMode === 'double') {
        document.body.classList.add('nb-ext-native-double-mode');
      } else {
        document.body.classList.remove('nb-ext-native-double-mode');
      }
      
      await ToolbarManager.initToolbar(manager);
      this.applyFilter(manager);
      if (typeof LayoutEngine !== 'undefined') {
        LayoutEngine.syncContainerSize(manager);
      }
    } catch (e) {
      console.error('Render error:', e);
    } finally {
      manager.isRendering = false;
    }
  },

  applyFilter(manager) {
    const query = manager.searchQuery.trim().toLowerCase();
    const isSearching = !!query;
    
    const scrollArea = document.querySelector('.scroll-area-desktop') || 
                       document.querySelector('.mat-drawer-inner-container') ||
                       document.querySelector('.source-panel-content') ||
                       document.querySelector('.mat-dialog-content') ||
                       document.querySelector('.mat-mdc-dialog-content');
    
    if (scrollArea) {
      if (isSearching) scrollArea.classList.add('nb-ext-search-active');
      else scrollArea.classList.remove('nb-ext-search-active');
    } else {
      return;
    }

    const andGroups = query.split('+').map(g => g.trim()).filter(g => g);
    
    const matches = (text) => {
      if (!isSearching) return true;
      const cleanText = text.replace(/\.(docx|pdf|txt|md|pptx|xlsx)$/i, '').toLowerCase();
      return andGroups.every(group => group.split(/\s+/).filter(t => t).some(term => cleanText.includes(term)));
    };

    // 1. Filter Leaf Items (Sources)
    // Find only the elements that truly represent sources to avoid hiding structural/ripple buttons
    const sourceElements = scrollArea.querySelectorAll('.source-stretched-button, button[class*="stretched-button"], [class*="source-item" i] button');
    
    let visibleCount = 0;
    const seenRows = new Set();

    sourceElements.forEach(el => {
      const row = el.closest('.mat-mdc-list-item, .mat-list-item, .mat-tree-node, .cdk-tree-node, [role="listitem"], [role="treeitem"], [class*="source-item" i]') || el.parentElement;
      if (!row || seenRows.has(row)) return;
      seenRows.add(row);

      const titleEl = row.querySelector('.mdc-list-item__primary-text, .source-item-name, [class*="title" i], [class*="name" i], button[aria-label]') || row;
      const rawText = (row.getAttribute('aria-label') || titleEl.getAttribute('aria-label') || titleEl.textContent || "").trim();
      
      if (rawText.length > 500 || /select all|add sources|search the web/i.test(rawText)) {
        return; 
      }

      const isFolder = row.matches('mat-expansion-panel, .mat-expansion-panel, [class*="folder" i]');
      if (isFolder) return;

      if (matches(rawText)) {
        row.classList.remove('nb-ext-native-hidden');
        row.style.display = ''; 
        if (isSearching) visibleCount++;
      } else {
        row.classList.add('nb-ext-native-hidden');
        row.style.setProperty('display', 'none', 'important');
      }
    });

    // 2. Filter Groups / Folders / Labels
    const groups = scrollArea.querySelectorAll('.mat-mdc-list-group, [class*="label-group" i], mat-expansion-panel, .mat-expansion-panel');
    groups.forEach(group => {
      const header = group.querySelector('.mat-expansion-panel-header, [class*="header" i], .mdc-list-group__subheader, [class*="title" i]') || group;
      const headerText = (header.textContent || "").trim();
      
      let hasVisibleItems = false;
      seenRows.forEach(row => {
        if (group.contains(row) && !row.classList.contains('nb-ext-native-hidden')) {
          hasVisibleItems = true;
        }
      });
      
      if (isSearching) {
        if (matches(headerText) || hasVisibleItems) {
          group.classList.remove('nb-ext-native-hidden');
          group.style.display = '';
        } else {
          group.classList.add('nb-ext-native-hidden');
          group.style.setProperty('display', 'none', 'important');
        }
      } else {
        group.classList.remove('nb-ext-native-hidden');
        group.style.display = '';
      }
    });

    // 3. Filter Standalone Subheaders
    const standaloneHeaders = scrollArea.querySelectorAll('.mdc-list-group__subheader, .source-list-label, [class*="section-header" i]');
    standaloneHeaders.forEach(header => {
       if (header.closest('.mat-mdc-list-group, [class*="label-group" i], mat-expansion-panel')) return;
       
       const headerText = (header.textContent || "").trim();
       if (/select all|add sources/i.test(headerText)) return;

       if (isSearching) {
          let hasVisibleSibling = false;
          let next = header.nextElementSibling;
          while (next && !next.matches('.mdc-list-group__subheader, .source-list-label, [class*="section-header" i]')) {
            if (seenRows.has(next) && !next.classList.contains('nb-ext-native-hidden')) {
              hasVisibleSibling = true;
              break;
            }
            if (next.querySelector) {
               let foundVisible = false;
               seenRows.forEach(row => {
                  if (next.contains(row) && !row.classList.contains('nb-ext-native-hidden')) {
                     foundVisible = true;
                  }
               });
               if (foundVisible) {
                  hasVisibleSibling = true;
                  break;
               }
            }
            next = next.nextElementSibling;
          }

          if (matches(headerText) || hasVisibleSibling) {
            header.classList.remove('nb-ext-native-hidden');
            header.style.display = '';
          } else {
            header.classList.add('nb-ext-native-hidden');
            header.style.setProperty('display', 'none', 'important');
          }
       } else {
          header.classList.remove('nb-ext-native-hidden');
          header.style.display = '';
       }
    });

    const infoEl = document.querySelector('.nb-ext-search-info');
    if (infoEl) {
      if (isSearching) infoEl.textContent = `Found ${visibleCount} item${visibleCount !== 1 ? 's' : ''}`;
      else infoEl.textContent = 'Use + for AND search';
    }
  },

  selectAllVisible() {
    // 1. Target all checkboxes in the source list area
    const allCheckboxes = document.querySelectorAll('mat-checkbox');
    
    allCheckboxes.forEach(cb => {
      // Exclude the "Select All" checkbox itself if it's visible in the native UI
      if (cb.classList.contains('select-checkbox-all-sources') || cb.textContent.includes('Select all')) return;
      
      // 2. Identify the parent row to check visibility
      const row = cb.closest('.single-source-container, .mat-mdc-list-item, .mat-list-item, .source-item, .mat-tree-node, .cdk-tree-node, [role="listitem"], [role="treeitem"]');
      if (!row) return;

      const isVisible = !row.classList.contains('nb-ext-native-hidden') && row.offsetParent !== null;
      const isChecked = cb.classList.contains('mat-mdc-checkbox-checked') || cb.getAttribute('aria-checked') === 'true';

      // 3. Select matching (visible) ones that aren't checked
      if (isVisible && !isChecked) {
        const clickable = cb.querySelector('input[type="checkbox"]') || cb;
        clickable.click();
      }
      // Note: We don't uncheck hidden ones here to avoid disrupting previous selections 
      // unless the user specifically wants a "Select Exactly Matching" behavior.
    });
  },

  showConfirm(titleText, messageHtml) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'nb-ext-modal-overlay';
      overlay.style.zIndex = '1000200';
      const content = document.createElement('div');
      content.className = 'nb-ext-modal-content';
      content.innerHTML = `
        <h3>${titleText}</h3>
        <div class="nb-ext-modal-body">${messageHtml}</div>
        <div class="nb-ext-modal-actions">
          <button class="nb-ext-btn-cancel">Cancel</button>
          <button class="nb-ext-btn-confirm">Confirm</button>
        </div>
      `;
      overlay.appendChild(content);
      document.body.appendChild(overlay);

      content.querySelector('.nb-ext-btn-cancel').onclick = () => { overlay.remove(); resolve(false); };
      content.querySelector('.nb-ext-btn-confirm').onclick = () => { overlay.remove(); resolve(true); };
    });
  }
};

if (typeof window !== 'undefined') window.UIRenderer = UIRenderer;
