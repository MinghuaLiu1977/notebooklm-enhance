# Privacy Policy for NotebookLM Directory Manager

*Effective Date: March 12, 2026*

This Privacy Policy describes how the **NotebookLM Directory Manager** ("we," "our," or "the extension") handles your data. We are committed to protecting your privacy and ensuring a safe, transparent experience.

### 1. Information Collection and Use

**We do not collect, transmit, store externally, or sell any of your personal data.**

The NotebookLM Directory Manager operates entirely locally on your device (within your browser). The core functionality of the extension—such as organizing your NotebookLM documents into folders, saving the tree structure, and managing custom categories—relies strictly on your browser's local `storage` API.

- **Local Storage:** The extension saves the folder structures, user preferences, and categorized document IDs to your browser's local storage mechanism (`chrome.storage.local`). This data never leaves your device.
- **No External Servers:** The extension does not communicate with any external servers. We do not have access to any of your data, notes, or usage habits.

### 2. Required Permissions and Justifications

To function properly, our extension requests the following permissions as declared in the `manifest.json`:

- **`storage`**: Required to locally save and retrieve your custom folder configurations and categorizations. Without this, your folder structure would be lost upon refreshing the page.
- **`host_permissions` (`https://notebooklm.google.com/*`)**: Required to inject the necessary scripts (`content.js`, `storage.js`) and styles (`main.css`) into the NotebookLM official website. This allows the extension to modify the user interface (e.g., adding tree views and search panels) dynamically. No operations are performed outside of this specific domain, and no web traffic is intercepted or monitored beyond rendering our UI modifications.

### 3. Third-Party Access

Because no data is ever transmitted from your device, we do not—and cannot—share any data with third parties.

**Relationship with Google:** 
This extension is an independent tool designed to enhance the interface and productivity of Google NotebookLM. It is not affiliated with, endorsed by, or sponsored by Google LLC. The extension strictly adheres to Google Chrome Web Store Developer Program Policies.

### 4. Changes to This Privacy Policy

We may update this Privacy Policy from time to time if the functionality of the extension changes in a way that affects privacy (for instance, if we add features that require new permissions). Any updates will be reflected on this page during the extension update process on the Chrome Web Store.

### 5. Contact Information

If you have any questions or concerns about this Privacy Policy or how the extension works, please contact the developer via the official GitHub repository for this project:

- **GitHub Repository**: [https://github.com/MinghuaLiu1977/notebooklm-ext](https://github.com/MinghuaLiu1977/notebooklm-ext)

---

*By installing and using the NotebookLM Directory Manager extension, you agree to the practices described in this Privacy Policy.*
