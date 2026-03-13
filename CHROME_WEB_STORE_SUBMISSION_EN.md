# Chrome Web Store Submission Details (English)

Here is the English content you need to fill out in the Chrome Web Store Developer Dashboard. You can copy and paste these directly.

## 1. Store Listing

### **Name** (Maximum 45 characters)
> NotebookLM Enhancer

### **Summary** (Maximum 132 characters)
> Enhance Google NotebookLM with powerful folder management, a structured tree view, and advanced logical search capabilities.

### **Detailed Description** (Maximum 16,000 characters)
> Unlock the full potential of Google NotebookLM with the NotebookLM Enhancer! Say goodbye to cluttered, flat document lists and hello to a structured, highly efficient knowledge management experience.
> 
> 🌟 **Core Features**
> 
> **1. Structured Directory System (Tree View Management)**
> - Seamlessly create, rename, and manage custom folders.
> - Easily categorize your documents using dropdown menus or drag-and-drop.
> - Automatically isolates unassigned documents into an "Uncategorized" section to keep your workspace tidy.
> - Multi-selection support: Check a folder to automatically select all its nested source documents for quick batch processing.
> 
> **2. Advanced Floating Search**
> - A modern, frosted-glass floating search panel that doesn't waste precious vertical space.
> - Supports advanced logical filtering (e.g., using "space" for OR, "+" for AND).
> - Intelligently hides empty folders and categories when searching, keeping the view clean.
> - Perfect support for IME (Input Method Editors, e.g., Pinyin for Chinese).
> 
> **3. Native UI Integration & Responsive Design**
> - Deeply integrated with Google's Material Design, feeling like a built-in feature.
> - Automatic Light/Dark theme switching based on native NotebookLM settings.
> - Adaptive panel width that smoothly follows your sidebar resizing.
> 
> **4. Performance & Security**
> - High-performance DOM manipulation using secure methods (CSP-compliant).
> - Completely local processing: The extension only modifies the UI on your client side and NEVER uploads, reads, or interferes with your actual note data contents.
> 
> *Disclaimer: This extension is an independent tool developed to improve productivity and has no affiliation, sponsorship, or partnership with Google LLC or official NotebookLM.*

### **Category**
> Productivity
*(Recommended: Productivity or Developer Tools)*

---

## 2. Privacy Practices

### **Single Purpose Description**
> This extension is designed solely to enhance the Google NotebookLM user interface by providing local directory management, visual customization, and advanced search functionality for easier document organization.

### **Permission Justification**
If the dashboard asks you to justify the permissions requested in your `manifest.json`, use the following explanations:

**1. `storage` permission:**
> **Justification:** Required to save the user's custom folder structures and document categorization locally on their device. No data is sent to any external server.

**2. `host_permissions` (`https://notebooklm.google.com/*` and `https://api.gumroad.com/*`):**
> **Justification:** 
> - `https://notebooklm.google.com/*`: Required to inject the necessary scripts and styles to provide the folder management and search UI directly on the host site.
> - `https://api.gumroad.com/*`: Required to securely verify user licenses via the Gumroad API for the optional premium features. No personal data beyond the license key is transmitted.

### **Data Collection**
- If asked whether you collect or use user data, select: **"No, I am not collecting user data."** (Because the extension only uses local `storage` and runs entirely in the browser).
