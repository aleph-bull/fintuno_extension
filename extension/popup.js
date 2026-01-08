/**
 * Popup Script
 * 
 * Displays time left for the current site if it is in the monitored list.
 */

const UPDATE_INTERVAL_MS = 1000;

async function updateTimer() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const div = document.getElementById('time-left');

    if (!tab || !tab.url) {
        div.textContent = "--:--";
        return;
    }

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
            div.textContent = timeString;
        } else {
            // Not in list, show default or blank.
            // For the Figma spec, it shows a time. If we aren't on a blocked site, maybe we show global remaining time?
            // The user said "dont need to make anything working other than the timer".
            // I'll show global remaining time regardless of site for now, or fallback.
            // Actually, let's just show global remaining time as that makes sense for "Time left on blocked apps".

            const usageState = await Storage.getUsageState();
            // If usageState doesn't exist yet (fresh install), handle gracefully
            if (usageState) {
                const remainingMs = Math.max(0, usageState.dailyLimitMs - usageState.globalUsage);
                const minutes = Math.floor(remainingMs / 60000);
                const seconds = Math.floor((remainingMs % 60000) / 1000);
                div.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                div.textContent = "15:00"; // Default
            }
        }

    } catch (e) {
        console.error("Popup Error:", e);
        div.textContent = "--:--";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateTimer();
    renderSites();
    setInterval(updateTimer, UPDATE_INTERVAL_MS);
});

async function renderSites() {
    const listEl = document.getElementById('blocked-list');
    listEl.innerHTML = ''; // Clear

    try {
        const sites = await Storage.getAllSites();
        const siteKeys = Object.keys(sites);

        if (siteKeys.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:10px; font-size:12px; color:rgba(255,255,255,0.4)">No active sites</div>';
            return;
        }

        // Sort by name or usage? Alphabetical for now.
        siteKeys.sort();

        siteKeys.forEach(key => {
            const site = sites[key];
            // If we have displayName, use it. Otherwise use key.
            const displayName = site.displayName || key;
            const iconLetter = displayName.charAt(0).toUpperCase();

            // Create row
            const row = document.createElement('div');
            row.className = 'site-row';

            // We don't have individual site usage in the current schema (only global usage).
            // So we won't show a time per site, or we could show "Active" or similar.
            // For now, let's just show the name.

            row.innerHTML = `
                <div class="site-info">
                    <div class="site-icon">${iconLetter}</div>
                    <span class="site-name">${displayName}</span>
                </div>
                <!-- <span class="site-time">--</span> --> 
            `;

            listEl.appendChild(row);
        });

    } catch (e) {
        console.error("Failed to render sites:", e);
    }
}

