/**
 * NotebookLM Enhancer - Utilities
 */
var NotebookUtils = {
  // File extension identification
  getFileIcon(filename) {
    if (!filename) return { icon: 'description', type: 'doc' };
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      'pdf': { icon: 'picture_as_pdf', type: 'pdf' },
      'doc': { icon: 'article', type: 'doc' }, 'docx': { icon: 'article', type: 'doc' },
      'xls': { icon: 'table_view', type: 'sheet' }, 'xlsx': { icon: 'table_view', type: 'sheet' }, 'csv': { icon: 'table_view', type: 'sheet' },
      'ppt': { icon: 'present_to_all', type: 'slide' }, 'pptx': { icon: 'present_to_all', type: 'slide' },
      'png': { icon: 'image', type: 'image' }, 'jpg': { icon: 'image', type: 'image' }, 'jpeg': { icon: 'image', type: 'image' }, 'gif': { icon: 'image', type: 'image' }, 'webp': { icon: 'image', type: 'image' },
      'txt': { icon: 'notes', type: 'doc' }, 'md': { icon: 'description', type: 'doc' },
      'zip': { icon: 'folder_zip', type: 'zip' }, 'rar': { icon: 'folder_zip', type: 'zip' }, '7z': { icon: 'folder_zip', type: 'zip' },
      'html': { icon: 'html', type: 'code' }, 'js': { icon: 'javascript', type: 'code' }, 'css': { icon: 'css', type: 'code' },
      'mp3': { icon: 'audio_file', type: 'media' }, 'wav': { icon: 'audio_file', type: 'media' },
      'mp4': { icon: 'video_file', type: 'media' }, 'mov': { icon: 'video_file', type: 'media' }
    };
    return map[ext] || { icon: 'description', type: 'doc' };
  },

  /**
   * Change the state of Material Checkbox
   * @param {HTMLElement} element - DOM element containing material-symbols-outlined class
   * @param {string} state - Target state: 'all', 'none', 'partial'
   */
  setCheckboxState(element, state) {
    if (!element) return;
    
    element.setAttribute('data-checked-state', state);
    
    if (state === 'all') {
      element.textContent = 'check_box';
      element.setAttribute('data-checked', 'true');
    } else if (state === 'partial') {
      element.textContent = 'indeterminate_check_box';
      element.setAttribute('data-checked', 'partial');
    } else {
      element.textContent = 'check_box_outline_blank';
      element.setAttribute('data-checked', 'false');
    }
  }
};
