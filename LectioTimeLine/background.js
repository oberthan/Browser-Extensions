// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'saveColor') {
        // Store the color in Chrome's local storage
        chrome.storage.local.set({ [request.seed]: request.color });
    }
});

// chrome.setInterval(replaceHRElements, 60*1000);
// setInterval(replaceHRElements, 60*1000);
