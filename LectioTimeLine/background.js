// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'saveColor') {
        // Store the color in Chrome's local storage
        chrome.storage.local.set({ [request.seed]: request.color });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'isColorChanged') {
        // Store the color in Chrome's local storage
        chrome.storage.local.set({ [request.seed]: request.changed });
    }
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.type === 'updateColors') {
        
//     }
// });

