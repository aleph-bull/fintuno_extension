/**
 * Storage Helper
 * 
 * Handles interactions with chrome.storage.local for the 'sites' key.
 * Schema:
 * sites: {
 *   [siteKey: string]: {
 *     displayName: string
 *     isBlocked: boolean
 *     blockedUntil: number        // epoch ms
 *     unblockUntil: number        // epoch ms
 *     lastChangedAt: number
 *   }
 * }
 */

const STORAGE_KEY = 'sites';
const STORAGE_KEY_USAGE = 'usage';
const DEFAULT_DAILY_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

const Storage = {
    /**
     * Get the entire sites object
     * @returns {Promise<Object>}
     */
    async getAllSites() {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        return result[STORAGE_KEY] || {};
    },

    /**
     * Get usage state
     * @returns {Promise<{globalUsage: number, lastUpdated: number, nextReset: number, dailyLimitMs: number}>}
     */
    async getUsageState() {
        const result = await chrome.storage.local.get(STORAGE_KEY_USAGE);
        let usage = result[STORAGE_KEY_USAGE] || {
            globalUsage: 0,
            lastUpdated: Date.now(),
            nextReset: Storage._getNextMidnight(),
            dailyLimitMs: DEFAULT_DAILY_LIMIT_MS
        };

        // Check for reset
        if (Date.now() >= usage.nextReset) {
            usage.globalUsage = 0;
            usage.nextReset = Storage._getNextMidnight();
            usage.lastUpdated = Date.now();
            await chrome.storage.local.set({ [STORAGE_KEY_USAGE]: usage });
        }

        return usage;
    },

    async incrementGlobalUsage(ms) {
        const usage = await this.getUsageState(); // Handles reset check internally
        usage.globalUsage += ms;
        usage.lastUpdated = Date.now();
        await chrome.storage.local.set({ [STORAGE_KEY_USAGE]: usage });
        return usage;
    },

    async setDailyLimit(ms) {
        const usage = await this.getUsageState();
        usage.dailyLimitMs = ms;
        await chrome.storage.local.set({ [STORAGE_KEY_USAGE]: usage });
    },

    _getNextMidnight() {
        const d = new Date();
        d.setHours(24, 0, 0, 0);
        return d.getTime();
    },

    /**
     * Get state for a specific site
     * @param {string} siteKey 
     * @returns {Promise<Object|null>}
     */
    async getSiteState(siteKey) {
        const sites = await this.getAllSites();
        return sites[siteKey] || null;
    },

    /**
     * Set state for a specific site
     * @param {string} siteKey 
     * @param {Object} state 
     * @returns {Promise<void>}
     */
    async setSiteState(siteKey, state) {
        const sites = await this.getAllSites();
        sites[siteKey] = {
            ...sites[siteKey],
            ...state,
            lastChangedAt: Date.now()
        };
        await chrome.storage.local.set({ [STORAGE_KEY]: sites });
    },

    /**
     * Initialize storage if empty
     */
    async init() {
        const sites = await this.getAllSites();
        if (!sites) {
            await chrome.storage.local.set({ [STORAGE_KEY]: {} });
        }

        // Ensure usage key exists or defaults are set via getUsageState logic on first access, 
        // but explicit init can be good practice.
        const result = await chrome.storage.local.get(STORAGE_KEY_USAGE);
        if (!result[STORAGE_KEY_USAGE]) {
            await chrome.storage.local.set({
                [STORAGE_KEY_USAGE]: {
                    globalUsage: 0,
                    lastUpdated: Date.now(),
                    nextReset: Storage._getNextMidnight(),
                    dailyLimitMs: DEFAULT_DAILY_LIMIT_MS
                }
            });
        }
    }
};

// Expose globally or for import depending on context (background/content)
if (typeof self !== 'undefined') {
    self.Storage = Storage;
}
