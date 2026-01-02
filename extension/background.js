/**
 * Background Service Worker
 * 
 * Authorities logic for blocking and time management.
 */

importScripts('storage.js');

// Listen for installation/updates
chrome.runtime.onInstalled.addListener(() => {
    Storage.init();
});

// Message Handler: CHECK_ACCESS
// Message Handler: CHECK_ACCESS & REPORT_USAGE
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_ACCESS') {
        handleCheckAccess(request.url).then(sendResponse);
        return true; // Keep channel open
    }
    if (request.type === 'REPORT_USAGE') {
        handleReportUsage(request.ms, sender).then(sendResponse);
        return true;
    }
});

/**
 * Handle usage reporting
 * @param {number} ms 
 * @param {object} sender
 * @returns {Promise<{allowed: boolean}>}
 */
async function handleReportUsage(ms, sender) {
    // Only count usage for tracked sites
    if (!sender.tab || !sender.tab.url) return { allowed: true };
    const url = sender.tab.url;
    const hostname = new URL(url).hostname;
    const siteKey = hostname.replace(/^www\./, '');

    // Check if site is tracked
    const state = await Storage.getSiteState(siteKey);
    if (!state) {
        // Not a monitored site, don't count usage
        // Note: needed for "combined usage of youtube and x"
        return { allowed: true };
    }

    const usageState = await Storage.incrementGlobalUsage(ms);
    if (usageState.globalUsage >= usageState.dailyLimitMs) {
        return { allowed: false };
    }
    return { allowed: true };
}

/**
 * Handle access check request
 * @param {string} url 
 * @returns {Promise<{allowed: boolean, reason?: string, siteKey?: string}>}
 */
async function handleCheckAccess(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // Simple normalization: remove www.
        const siteKey = hostname.replace(/^www\./, '');

        // 1. GLOBAL USAGE CHECK (Only if site is tracked)
        const siteState = await Storage.getSiteState(siteKey);

        if (siteState) {
            const usageState = await Storage.getUsageState();
            if (usageState.globalUsage >= usageState.dailyLimitMs) {
                return { allowed: false, reason: 'Daily Limit Reached', siteKey };
            }

            // MIGRATION FIX:
            // If this is a legacy site and isBlocked is TRUE, it's likely stale state from previous version.
            // We should reset it to FALSE to allow the usage limit system to take over.
            const LEGACY_BLOCKED = ["x.com", "youtube.com", "twitter.com"];
            if (LEGACY_BLOCKED.includes(siteKey) && siteState.isBlocked) {
                console.log(`Migrating stale state for ${siteKey}: unblocking.`);
                siteState.isBlocked = false;
                siteState.blockedUntil = 0;
                await Storage.setSiteState(siteKey, siteState);

                // Continue to check other conditions below, but now isBlocked is false
                // so it shouldn't fall into the block check at the bottom.
            }
        }

        if (!siteState) {
            // Not tracked, allowed
            // OPTIONAL: Auto-add known blocked sites for demo purposes if not present
            // For now, we assume user/system adds them. 
            // If the simple BLOCKED list from previous version is desireable to migrate:
            const LEGACY_BLOCKED = ["x.com", "youtube.com", "twitter.com"];
            if (LEGACY_BLOCKED.includes(siteKey)) {
                // Initialize default MONITORED state (not blocked yet)
                const newState = {
                    displayName: siteKey,
                    isBlocked: false, // Allow access initially, let usage limit handle it
                    blockedUntil: 0,
                    unblockUntil: 0,
                    lastChangedAt: Date.now()
                };
                await Storage.setSiteState(siteKey, newState);
                // Don't return false, allow it now that it's monitored
                return { allowed: true };
            }
            return { allowed: true };
        }

        const state = siteState; // Re-use

        const now = Date.now();

        // Check for temporary unblock
        if (state.unblockUntil && state.unblockUntil > now) {
            return { allowed: true, reason: 'Temporarily Unblocked' };
        }

        // Check if block is active
        if (state.isBlocked) {
            if (state.blockedUntil && state.blockedUntil > now) {
                return { allowed: false, reason: 'Site Blocked', siteKey };
            } else {
                // Timer expired, clear block
                await Storage.setSiteState(siteKey, { isBlocked: false, blockedUntil: 0 });
                return { allowed: true, reason: 'Block Expired' };
            }
        }

        return { allowed: true };

    } catch (e) {
        console.error("Error checking access:", e);
        return { allowed: true }; // Fail open
    }
}


// Alarms for expiration cleanup
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name.startsWith('expire_')) {
        const siteKey = alarm.name.replace('expire_', '');
        await checkAndExpire(siteKey);
    }
});

async function checkAndExpire(siteKey) {
    const state = await Storage.getSiteState(siteKey);
    if (!state) return;

    const now = Date.now();
    let changed = false;

    if (state.isBlocked && state.blockedUntil <= now && state.blockedUntil !== 0) {
        state.isBlocked = false;
        state.blockedUntil = 0;
        changed = true;
    }

    if (state.unblockUntil <= now && state.unblockUntil !== 0) {
        state.unblockUntil = 0;
        // Revert to blocked status if originally blocked? 
        // Spec says "unblockUntil (temporary unlock)". Usually implies falling back to block.
        // Assuming if unblock expires, we just clear the unblock flag. 
        // If isBlocked was still true, it remains true, handling the re-block.
        changed = true;
    }

    if (changed) {
        await Storage.setSiteState(siteKey, state);
    }
}

// Function to set alarms when state changes (can be called from popup/options or messaging)
// Not strictly needed if we check on access, but good for background cleanup.
async function setExpirationAlarm(siteKey, timestamp) {
    const when = timestamp;
    if (when > Date.now()) {
        chrome.alarms.create(`expire_${siteKey}`, { when });
    }
}
