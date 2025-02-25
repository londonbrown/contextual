// Create a context menu item that appears when text is selected.
chrome.contextMenus.create({
    id: "contextual",
    title: "Contextual",
    contexts: ["selection"]
})
