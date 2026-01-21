//console.log("📦 content.js loaded in", location.origin);

// Ask background to inject MAIN-world hook into this frame.
// Background will receive sender.frameId and inject into that exact frame.
chrome.runtime.sendMessage({ type: "REQUEST_MAIN_INJECTION" }, (resp) => {
    // optional ack
    // console.log("injection request ack:", resp);
});

window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.type === "FETCH_RESPONSE") {

        try {
            const parsed = JSON.parse(event.data.body);
            console.log("Spillet vinder:", parsed['win']/100);
        } catch (e) {}
    }
});
