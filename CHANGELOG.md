# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-02-25

### Added
- A "Manage Search Engines" option was added as a child of the "Contextual" top-level right click menu for quick access
- An initial default state is now provided 

## [1.0.0] - 2025-02-24

### Added

- **Contextual Search Extension**
    - **Context Menus:**
        - Nested right-click menu system for highlighted text with custom search engine selection.
        - Non-container search engines display the `: %s` placeholder to incorporate the user’s selection.
    - **Custom Search Engine Management:**
        - Add, edit, and delete search engines, with support for nested categories via an optional `parentId`.
        - Edit functionality pre-populates the form with the selected engine’s data and focuses the Query Format field.
    - **JSON Import/Export:**
        - Backup and restore your search engine settings via JSON files.
    - **Sync Across Devices:**
        - Uses `chrome.storage.sync` to automatically persist settings across sessions and devices.
    - **Cross-Browser Compatibility:**
        - Built using the WebExtensions API for seamless use in both Chrome and Firefox.
    - **UI and DOM Enhancements:**
        - Modern, clean user interface with clear visual differentiation for categories.
        - Secure DOM handling using safe methods (e.g., `textContent`) instead of `innerHTML`.
