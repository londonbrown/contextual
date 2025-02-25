
// Function to update the context menus based on stored search engines.
function updateContextMenus() {
    // First, remove any existing menu items.
    chrome.contextMenus.removeAll(() => {
        // Create the top-level menu item.
        chrome.contextMenus.create({
            id: "contextual",
            title: "Contextual",
            contexts: ["selection"]
        })
    })

    // Retrieve the user's search engines from storage.
    chrome.storage.sync.get("contextualSearchEngines", (data) => {
        const engines = data.contextualSearchEngines || []
        engines.forEach((engine) => {
            chrome.contextMenus.create({
                id: "contextual_engine_" + engine.id,
                // The %s will be replaced by the highlighted text.
                title: `${engine.displayName}: %s`,
                parentId: "contextual",
                contexts: ["selection"]
            })
        })
    })
}

// Initialize the context menus when the extension starts.
updateContextMenus()

// Listen for clicks on any context menu item.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    // Check if the clicked item is one of our engine items.
    if (info.menuItemId.startsWith("contextual_engine_")) {
        // Extract the engine id from the menu item's id.
        const engineId = info.menuItemId.split("_")[2]
        // Retrieve the current search engines.
        chrome.storage.sync.get("contextualSearchEngines", (data) => {
            const engines = data.contextualSearchEngines || []
            // Find the engine matching the extracted id
            const engine = engines.find(e => e.id === engineId)
            if (engine) {
                // Replace "%s" in the engine queryFormat with the encoded selected text.
                const searchUrl = engine.queryFormat.replace("%s", encodeURIComponent(info.selectionText))
                chrome.tabs.create({ url: searchUrl }, (tab) => {
                    console.log(`Opened ${tab.url} in a new tab.`)
                })
            }
        })
    }
})

// Update the context menus when the stored search engines change.
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.contextualSearchEngines) {
        updateContextMenus()
    }
})