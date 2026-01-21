// Optional: log when extension starts
//console.log("background service worker started");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "REQUEST_MAIN_INJECTION") return;

    // sender.tab and sender.frameId tell us where to inject
    if (!sender.tab || typeof sender.frameId === "undefined") {
        sendResponse({ ok: false, reason: "no tab/frameId" });
        return;
    }

    const tabId = sender.tab.id;
    const frameId = sender.frameId;

    // Inject MAIN-world script into that frame
    chrome.scripting.executeScript({
        target: { tabId, frameIds: [frameId] },
        world: "MAIN",
        func: () => {
            if (window.__XHR_READY_HOOKED__) return;
            window.__XHR_READY_HOOKED__ = true;

            //console.log("✅ Injected XHR onreadystatechange hook in MAIN world, frame:", location.origin);

            const proto = XMLHttpRequest.prototype;
            // keep original descriptor if present (safe wrapper)
            const desc = Object.getOwnPropertyDescriptor(proto, "onreadystatechange") || {
                configurable: true,
                enumerable: true,
            };

            // Define setter/getter that wraps assigned handlers
            Object.defineProperty(proto, "onreadystatechange", {
                configurable: true,
                enumerable: true,
                set(fn) {
                    const wrapped = function (...args) {
                        try {
                            if (
                                this.readyState === 4 &&
                                this.status === 200 &&
                                this.responseText &&
                                this._url &&
                                (this._url.includes("/engine2/game/play"))
                            ) {
                                window.postMessage(
                                    { type: "FETCH_RESPONSE", url: this._url, body: this.responseText },
                                    "*"
                                );
                            }
                        } catch (e) {
                            // swallow errors so we don't break page logic
                        }

                        return fn && fn.apply(this, args);
                    };

                    // if original descriptor had a setter, call it; otherwise set as property
                    if (desc && typeof desc.set === "function") {
                        return desc.set.call(this, wrapped);
                    } else {
                        // fallback: set as own property
                        Object.defineProperty(this, "onreadystatechange", {
                            configurable: true,
                            writable: true,
                            enumerable: false,
                            value: wrapped
                        });
                        return wrapped;
                    }
                },
                get() {
                    if (desc && typeof desc.get === "function") {
                        return desc.get.call(this);
                    }
                    return undefined;
                }
            });

            // Capture open() to remember the URL
            const originalOpen = proto.open;
            proto.open = function (method, url, ...rest) {
                try { this._url = url; } catch (e) {}
                return originalOpen.apply(this, [method, url, ...rest]);
            };
        }
    }).then(() => {
        sendResponse({ ok: true });
    }).catch((err) => {
        console.error("Injection failed:", err);
        sendResponse({ ok: false, reason: String(err) });
    });

    // keep message channel open for async sendResponse
    return true;
});
