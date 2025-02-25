
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

        chrome.storage.sync.get("contextualSearchEngines", function (result) {
            const engines = (result && result.contextualSearchEngines) ? result.contextualSearchEngines : []

            // For each engine, decide on its menu id and parent.
            engines.forEach(engine => {
                let menuId = ""
                let parentMenuId = ""
                let title = ""

                // If an engine is meant to be a container (queryFormat is null)
                // or is nested (has a parentId), use the custom prefix.
                if (engine.parentId || engine.queryFormat === null) {
                    menuId = "contextual_engine_custom_" + engine.id
                    // If this engine is nested, its parent's menu id must use the custom prefix.
                    if (engine.parentId) {
                        parentMenuId = "contextual_engine_custom_" + engine.parentId
                    } else {
                        // Top-level container: parent is "contextual"
                        parentMenuId = "contextual"
                    }
                    // Containers display just their name.
                    title = engine.displayName
                } else {
                    // A top-level search engine (non-container)
                    menuId = "contextual_engine_" + engine.id
                    parentMenuId = "contextual"
                    title = `${engine.displayName}: %s`
                }

                chrome.contextMenus.create({
                    id: menuId,
                    title: title,
                    parentId: parentMenuId,
                    contexts: ["selection"]
                })
            })
        })
    })
}

// Initialize the context menus when the extension starts.
updateContextMenus()

// Listen for clicks on any context menu item.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const menuItemId = info.menuItemId
    let engineId = null

    // Determine if the menu item is a top-level or nested item.
    if (menuItemId.startsWith("contextual_engine_custom_")) {
        engineId = menuItemId.substring("contextual_engine_custom_".length)
    } else if (menuItemId.startsWith("contextual_engine_")) {
        engineId = menuItemId.substring("contextual_engine_".length)
    }

    if (engineId) {
        // Retrieve the current search engines.
        chrome.storage.sync.get("contextualSearchEngines", (data) => {
            const engines = data.contextualSearchEngines || []
            // Find the engine matching the extracted id
            const engine = engines.find(e => e.id === engineId)
            if (engine) {
                // Replace "{c}" in the engine queryFormat with the encoded selected text.
                const searchUrl = engine.queryFormat.replaceAll("{c}", encodeURIComponent(info.selectionText))
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