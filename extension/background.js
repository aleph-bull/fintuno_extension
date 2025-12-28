const BLOCKED = ["twitter.com", "www.twitter.com"];

function isBlocked(url) {
    try {
        const host = new URL(url).hostname;
        return BLOCKED.includes(host);
    } catch {
        return false;
    }
}

chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId !== 0) return;
    if (details.url.startsWith("chrome-extension://")) return;

    if (isBlocked(details.url)) {
        const blockedUrl =
            chrome.runtime.getURL("blocked.html") +
            "?target=" +
            encodeURIComponent(details.url);

        chrome.tabs.update(details.tabId, { url: blockedUrl });
    }
});
