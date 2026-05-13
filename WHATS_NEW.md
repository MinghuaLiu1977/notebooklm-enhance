# NotebookLM Enhancer - What's New

## [1.9.2] - 2026-05-13
### Fixed
- **Version Sync**: Corrected version display in the extension popup to match manifest.

## [1.9.1] - 2026-05-13
### Added
- **Select All Matching**: Added a new "Double-Check" icon in the search panel to quickly select all currently visible (matching) sources.
- **Improved Tree Node Support**: Enhanced selectors to reliably find and click checkboxes within complex nested folders and tree views.

## [1.9.0] - 2026-05-10
### Added
- **Major DOM Compatibility Update**: Completely refactored the source list detection logic to support the latest NotebookLM internal structure (including `cdk-tree-node`, `mat-checkbox` based rows, and complex nested folders).
- **Universal Modal Filtering**: Search now works reliably in the "Add Sources" and "Select Sources" dialogs.

## [1.8.8] - 2026-05-10
### Fixed
- **Deep Filtering Logic**: Fixed an issue where folders and list items in the new NotebookLM UI (and Source Selection modals) were not correctly hidden during search.
- **Improved UI Scraper**: Added support for hierarchical folder structures and tree nodes.
- **Enhanced Mutation Tracking**: Better detection of dynamic UI updates to ensure filters are always applied.

## [1.8.7] - 2026-05-09
### Fixed
- **Toolbar Shrink Button**: Fixed the icon (switched from gear to chevron) and improved functionality.
- **State Persistence**: The toolbar's expanded/shrunk state is now properly saved across sessions.
- **Mini Mode UI**: Redesigned the minimized toolbar as a premium floating circle for better accessibility.

## [1.8.6] - 2026-05-08
### Added
- **Native List Support**: The search and display mode (double-line) features now work directly on the native NotebookLM source list.
- **Improved 2026 UI Compatibility**: Updated selectors to support the latest three-column layout.
- **Dynamic View Toggling**: Automatically switches between native view and custom tree view based on settings.

### Changed
- Refactored `UIRenderer` to support filtering of native DOM elements.
- Optimized `LayoutEngine` to preserve native visibility in non-tree-view modes.
- Enhanced `main.css` with 2-line clamp styles for native labels.

## [1.8.5] - 2026-04-30

### ✨ Enhancements
* **Smart Context Menu Positioning**: Re-engineered the "Move to" context menu to intelligently detect viewport boundaries. It now automatically chooses between opening upwards or downwards based on available space and includes a scrollbar for extensive folder lists, ensuring menu items are never cut off.

---

# What's New in v1.8.4

### ✨ Enhancements
* **Optimized UI interactions**: Improved the interface responsiveness and overall user experience.

---

# What's New in v1.8.2

### ✨ Enhancements
* **Optimized Display of Unavailable Source Items**: Improved the visual styling and feedback for source items that are currently inaccessible or pending.
* **Brand New Product Showcase**: Added a highly interactive, native-feeling promotional page for SlideRev (our upcoming macOS companion app), featuring a smooth swipeable screenshot carousel to better demonstrate its capabilities.
* **Smart App Store Link**: The promotional popup now dynamically checks SlideRev's App Store availability in real time, automatically displaying a direct download link when ready.
* **Polished Tooling**: The extension toolbar now dynamically loads the SlideRev brand icon when collapsed, providing a more immersive and consistent navigation experience.

### 🐛 Bug Fixes
* **Toolbar State Persistence**: Fixed a bug where the customized toolbar preferences (such as collapsed state and view modes) would reset unexpectedly after restarting the browser. Your settings are now properly remembered.
* **Improved Responsiveness**: Resolved CSS scaling issues on the showcase page ensuring screenshots remain perfectly proportioned across all window sizes.
* **Search Reset on Switch**: Fixed a regression where search filters and the search panel would persist when switching between different notebooks.
* **Increased UI Reliability**: Re-engineered core interaction scripts to fully comply with Chrome's strictest Content Security Policy (CSP), eliminating random unresponsiveness during clicks.
