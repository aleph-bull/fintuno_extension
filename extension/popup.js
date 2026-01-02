/**
 * Popup Script
 * 
 * Displays time left for the current site if it is in the monitored list.
 */

const UPDATE_INTERVAL_MS = 1000;

async function updateTimer() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) return;

    try {
        const urlObj = new URL(tab.url);
        const hostname = urlObj.hostname;
        const siteKey = hostname.replace(/^www\./, '');

        const state = await Storage.getSiteState(siteKey);

        if (state) {
            // Site is monitored, show time left
            const usageState = await Storage.getUsageState();
            const remainingMs = Math.max(0, usageState.dailyLimitMs - usageState.globalUsage);

            const minutes = Math.floor(remainingMs / 60000);
            const seconds = Math.floor((remainingMs % 60000) / 1000);

            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            const div = document.getElementById('time-left');
            div.textContent = `Time Left: ${timeString}`;
        } else {
            // Not in list, leave blank
            document.getElementById('time-left').textContent = "";
        }

    } catch (e) {
        console.error("Popup Error:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateTimer();
    setInterval(updateTimer, UPDATE_INTERVAL_MS);
});
