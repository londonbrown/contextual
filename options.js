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
    const displayNameInput = document.getElementById("engineDisplayName")
    const queryFormatInput = document.getElementById("engineQueryFormat")

    const newEngine = {
        id: idInput.value.trim(),
        displayName: displayNameInput.value.trim(),
        queryFormat: queryFormatInput.value.trim()
    }

    if (!newEngine.id || !newEngine.displayName || !newEngine.queryFormat) {
        alert("All fields are required")
        return;
    }

    chrome.storage.sync.get("contextualSearchEngines", (result) => {
        const data = result || {}
        let engines = data.contextualSearchEngines || []
        // Check if an engine with the same id exists
        const existingIndex = engines.findIndex(engine => engine.id === newEngine.id)
        if (existingIndex > -1) {
            // Update the existing engine.
            if (!confirm(`Engine with id "${newEngine.id}" already exists. Do you want to overwrite it?`)) {
                return
            }
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
            li.textContent = `${engine.displayName} (${engine.id}): ${engine.queryFormat}`

            // Create a delete button for each engine.
            const deleteBtn = document.createElement("button")
            deleteBtn.textContent = "Delete"
            deleteBtn.style.marginLeft = "10px"
            deleteBtn.addEventListener("click", () => {
                deleteEngine(engine.id)
            })

            li.appendChild(deleteBtn)
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

function handleImport(e) {

}
