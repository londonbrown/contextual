document.addEventListener("DOMContentLoaded", () => {
    // Load engines when the page loads.
    loadEngines()

    // Handle form submission to add or update an engine.
    document.getElementById("engine-form").addEventListener("submit", (e) => {
        e.preventDefault()
        addOrUpdateEngine()
    })

    // Export settings when "Export" is clicked.
    document.getElementById("exportBtn").addEventListener("click", () => {
        exportSettings()
    })

    // Trigger file selection when "Import" is clicked.

    document.getElementById("importBtn").addEventListener("click", () => {
        document.getElementById("importFile").click()
    })

    // Handle file selection for importing settings.
    document.getElementById("importFile").addEventListener("change", (e) => {
        handleImport(e)
    })
})

// Add or update a search engine from form values.
function addOrUpdateEngine() {
    const idInput = document.getElementById("engineId")
    const parentIdInput = document.getElementById("engineParentId")
    const displayNameInput = document.getElementById("engineDisplayName")
    const queryFormatInput = document.getElementById("engineQueryFormat")

    const newEngine = {
        id: idInput.value.trim(),
        displayName: displayNameInput.value.trim(),
        queryFormat: queryFormatInput.value.trim() || null,
        parentId: parentIdInput ? (parentIdInput.value.trim() || null) : null
    }

    if (!newEngine.id || !newEngine.displayName) {
        alert("All fields are required")
        return;
    }

    chrome.storage.sync.get("contextualSearchEngines", (result) => {
        const data = result || {}
        let engines = data.contextualSearchEngines || []

        // If a parentId is provided, ensure that parent exists.
        if (newEngine.parentId) {
            const parentExists = engines.some(engine => engine.id === newEngine.parentId)
            if (!parentExists) {
                if (confirm(`Parent with id "${newEngine.parentId}" does not exist. Do you want to create a placeholder parent?`)) {
                    // Create a placeholder parent (a category, so queryFormat is null).
                    engines.push({
                        id: newEngine.parentId,
                        displayName: newEngine.parentId,
                        queryFormat: null,
                        parentId: null
                    })
                } else {
                    // Cancel adding/updating if parent is missing.
                    return
                }
            }
        }

        // Check for duplicate engine id.
        const existingIndex = engines.findIndex(engine => engine.id === newEngine.id)
        if (existingIndex > -1) {
            if (!confirm(`Engine with id "${newEngine.id}" already exists. Do you want to overwrite it?`)) {
                return
            }
            // Update the existing engine.
            engines[existingIndex] = newEngine
        } else {
            // Add the new engine.
            engines.push(newEngine)
        }
        chrome.storage.sync.set({ contextualSearchEngines: engines}, () => {
            if (chrome.runtime.lastError) {
                console.error("Storage error:", chrome.runtime.lastError);
            } else {
                console.log("Data saved successfully.");
            }
            loadEngines()
            // Clear the form inputs.
            idInput.value = ""
            displayNameInput.value = ""
            queryFormatInput.value = ""
            parentIdInput.value = ""
        })
    })
}

// Load search engines from storage and display them in the list.
function loadEngines() {
    chrome.storage.sync.get("contextualSearchEngines", (result) => {
        const data = result || {}
        const engines = data.contextualSearchEngines || []
        const engineList = document.getElementById("engine-list")
        engineList.innerHTML = ""

        if (engines.length === 0) {
            engineList.textContent = "No search engines added yet."
            return;
        }

        engines.forEach(engine => {
            const li = document.createElement("li")
            li.style.marginBottom = "10px"

            // Add a CSS class if this is a category (i.e. queryFormat is null)
            if (engine.queryFormat === null) {
                li.classList.add("category")
            }

            li.innerHTML = `<span class="engine-info">
                ${engine.displayName} (${engine.id})` +
                        (engine.parentId ? ` [Parent: ${engine.parentId}]` : "") +
                        `: ${engine.queryFormat || "[Category]"}
              </span>`;

            const btnContainer = document.createElement("span");
            btnContainer.className = "item-buttons";

            // Create a delete button for each engine.
            const deleteBtn = document.createElement("button")
            deleteBtn.textContent = "Delete"
            deleteBtn.className = "delete"
            deleteBtn.style.marginLeft = "10px"
            deleteBtn.addEventListener("click", () => {
                deleteEngine(engine.id)
            })

            // Create an edit button.
            const editBtn = document.createElement("button")
            editBtn.textContent = "Edit"
            editBtn.className = "edit"
            editBtn.style.marginLeft = "10px"
            editBtn.addEventListener("click", () => {
                // Populate form fields with current engine values.
                document.getElementById("engineId").value = engine.id
                document.getElementById("engineParentId").value = engine.parentId || ""
                document.getElementById("engineDisplayName").value = engine.displayName
                document.getElementById("engineQueryFormat").value = engine.queryFormat || ""
                if (engine.queryFormat) {
                    // Focus on the query format field.
                    document.getElementById("engineQueryFormat").focus()
                } else {
                    // Focus on the display name field.
                    document.getElementById("engineDisplayName").focus()
                }
            })

            btnContainer.appendChild(editBtn)
            btnContainer.appendChild(deleteBtn)
            li.appendChild(btnContainer)
            engineList.appendChild(li)
        })
    })
}

// Delete a search engine by its id.
function deleteEngine(engineId) {
    chrome.storage.sync.get("contextualSearchEngines", (result) => {
        const data = result || {}
        let engines = data.contextualSearchEngines || []
        engines = engines.filter(engine => engine.id !== engineId)
        chrome.storage.sync.set({ contextualSearchEngines: engines}, () => {
            loadEngines()
        })
    })
}

function exportSettings() {
    chrome.storage.sync.get("contextualSearchEngines", (result) => {
        const data = result || {}
        const engines = data.contextualSearchEngines || []
        const blob = new Blob([JSON.stringify(engines, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url
        a.download = "contextualSearchEngines.json"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    })
}

// Handle importing settings from a JSON file.
function handleImport(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const importedEngines = JSON.parse(e.target.result)
            if (!Array.isArray(importedEngines)) {
                throw new Error("Invalid format: Expected an array.")
            }

            // Retrieve the current search engines.
            chrome.storage.sync.get("contextualSearchEngines", (result) => {
                const data = result || {}
                let currentEngines = data.contextualSearchEngines || []

                // Process each imported engine.
                for (const importedEngine of importedEngines) {
                    // If a parentId is provided, check if it exists in current storage or among the imports.
                    if (importedEngine.parentId) {
                        const parentExists =
                            currentEngines.some(engine => engine.id === importedEngine.parentId) ||
                            importedEngines.some(engine => engine.id === importedEngine.parentId)
                        if (!parentExists) {
                            if (confirm(`Parent with id "${importedEngine.parentId}" does not exist for engine "${importedEngine.id}". Create a placeholder parent?`)) {
                                currentEngines.push({
                                    id: importedEngine.parentId,
                                    displayName: importedEngine.parentId,
                                    queryFormat: null,
                                    parentId: null
                                })
                            } else {
                                // Skip this engine if the parent is missing
                                continue
                            }
                        }
                    }

                    // Check for duplicate engine id.
                    const index = currentEngines.findIndex(engine => engine.id === importedEngine.id)
                    if (index > -1) {
                        // If a duplicate exists, ask the user if they want to overwrite it.
                        if (confirm(`Engine with id "${importedEngine.id}" already exists. Do you want to overwrite it?`)) {
                            currentEngines[index] = importedEngine
                        }
                        // Otherwise, skip this imported engine.
                    } else {
                        // Not a duplicate, add the engine.
                        currentEngines.push(importedEngine)
                    }
                }
                chrome.storage.sync.set({ contextualSearchEngines: currentEngines }, () => {
                    loadEngines()
                    alert("Import successful!")
                })
            })
        } catch (error) {
            alert("Failed to import settings: " + error.message)
        }
    }
    reader.readAsText(file)
    // Reset the file input so the same file can be re-imported if needed.
    event.target.value = ""
}
