/**
 * Content Script
 * 
 * Runs on every page load (document_start).
 * Checks with the background script if the current site is blocked.
 * If blocked, redirects to the extension's redirect page which bridges to the Vercel app.
 */

(async () => {
    // Prevent infinite loop if we are already on the Vercel app or our redirect page
    // Note: redirect page is extension://, Vercel app is external.
    // Spec: "fintuno-extension.vercel.app"
    if (window.location.hostname === 'fintuno-extension.vercel.app') return;

    // Send message to background to check access
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'CHECK_ACCESS',
            url: window.location.href
        });

        if (response && response.allowed === false) {
            // Access Denied
            const siteKey = response.siteKey; // Background should provide this
            const redirectUrl = chrome.runtime.getURL(`redirect.html?site=${encodeURIComponent(siteKey)}`);

            // Replace location to avoid history stacking (user can't back-button to blocked site)
            window.location.replace(redirectUrl);
            return;
        }

        // Access Allowed - Start usage tracking
        const REPORT_INTERVAL_MS = 10000; // 10 seconds
        setInterval(async () => {
            if (!document.hidden) {
                try {
                    const response = await chrome.runtime.sendMessage({
                        type: 'REPORT_USAGE',
                        ms: REPORT_INTERVAL_MS
                    });

                    if (response && response.allowed === false) {
                        // Limit reached while browsing
                        location.reload();
                    }
                } catch (e) {
                    // connection error etc
                }
            }
        }, REPORT_INTERVAL_MS);

    } catch (e) {
        // Background might be waking up or extension context invalidated
        console.error("Fintuno Content Script Error:", e);
    }
})();
