// Initialize default state if no engines exist.
function initializeDefaultState() {
    chrome.storage.sync.get("contextualSearchEngines", function(result) {
        let engines = result.contextualSearchEngines
        if (!engines || engines.length === 0) {
            engines = [
                {
                    id: "duckduckgo",
                    displayName: "DuckDuckGo search",
                    queryFormat: "https://duckduckgo.com/?q={c}"
                },
                {
                    id: "youtube",
                    displayName: "YouTube search",
                    queryFormat: "https://www.youtube.com/results?search_query={c}"
                },
                {
                    id: "shopping_category",
                    displayName: "Shopping",
                    queryFormat: null
                },
                {
                    id: "amazon",
                    displayName: "Amazon",
                    parentId: "shopping_category",
                    queryFormat: "https://www.amazon.com/s?k={c}"
                }
            ]
            chrome.storage.sync.set({ contextualSearchEngines: engines }, function() {
                updateContextMenus()
            })
        } else {
            updateContextMenus()
        }
    })
}

function updateContextMenus() {
    chrome.contextMenus.removeAll(function() {
        // Create the top-level "Contextual" menu.
        chrome.contextMenus.create({
            id: "contextual",
            title: "Contextual",
            contexts: ["all"]
        })

        chrome.storage.sync.get("contextualSearchEngines", function(result) {
            const engines = (result && result.contextualSearchEngines) ? result.contextualSearchEngines : []

            // Build a map and initialize children array.
            const engineMap = {}
            engines.forEach(engine => {
                engine.children = []
                engineMap[engine.id] = engine
            })

            // Build the tree: assign children to their parents.
            const roots = []
            engines.forEach(engine => {
                if (engine.parentId && engineMap[engine.parentId]) {
                    engineMap[engine.parentId].children.push(engine)
                } else {
                    roots.push(engine)
                }
            })

            // Recursively create menus from the roots.
            roots.forEach(engine => {
                createMenuRecursive(engine, "contextual")
            })

            // Add separator between engines and other options
            chrome.contextMenus.create({
                id: "separator-1",
                type: "separator",
                parentId: "contextual",
                contexts: ["all"]
            })

            // Add "Manage Search Engines" item under "Contextual".
            chrome.contextMenus.create({
                id: "contextual_manage_search_engines",
                title: "Manage Search Engines",
                parentId: "contextual",
                contexts: ["all"]
            })
        })
    })
}

// Recursively create a context menu item.
function createMenuRecursive(engine, parentMenuId) {
    const isContainer = (engine.queryFormat === null)
    const isNested = (parentMenuId !== "contextual")

    // Determine the menu ID.
    const menuId = (isNested || isContainer)
        ? "contextual_engine_custom_" + engine.id
        : "contextual_engine_" + engine.id

    // Determine the title:
    // If it's a container, show only the displayName.
    // Otherwise, append ": %s" for search engines.
    const title = isContainer ? engine.displayName : `${engine.displayName}: %s`

    chrome.contextMenus.create({
        id: menuId,
        title: title,
        parentId: parentMenuId,
        contexts: ["selection"]
    }, function() {
        if (chrome.runtime.lastError) {
            console.error("Error creating menu:", chrome.runtime.lastError)
        }
    })

    // Recursively create child menu items.
    if (engine.children && engine.children.length > 0) {
        const newParentMenuId = "contextual_engine_custom_" + engine.id
        engine.children.forEach(child => {
            createMenuRecursive(child, newParentMenuId)
        })
    }
}

// Initialize the context menus when the extension starts.
updateContextMenus()

// Listen for clicks on any context menu item.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const menuItemId = info.menuItemId

    // If "Manage Search Engines" is clicked, open the options page.
    if (menuItemId === "contextual_manage_search_engines") {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage(() => {
                console.log("Opened Contextual Options page.")
            })
        } else {
            chrome.tabs.create({url: chrome.runtime.getURL("options.html")}, () => {
                console.log("Opened Contextual Options page.")
            })
        }
        return
    }

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

// Initialize default state on startup.
initializeDefaultState();

// Update the context menus when the stored search engines change.
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.contextualSearchEngines) {
        updateContextMenus()
    }
})