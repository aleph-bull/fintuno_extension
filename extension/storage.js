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
    }
};

// Expose globally or for import depending on context (background/content)
if (typeof self !== 'undefined') {
    self.Storage = Storage;
}
