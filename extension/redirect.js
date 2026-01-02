/**
 * Redirect Page Script
 * 
 * Bridges the gap between the internal extension blocking and the external Vercel app UI.
 * 1. Reads the 'site' query parameter.
 * 2. Fetches the full blocking state from Storage.
 * 3. Redirects to the Vercel app with all necessary state as query parameters.
 */

// We can load Storage helper via script tag in HTML, so Storage is available globally.
// See redirect.html

(async () => {
    const params = new URLSearchParams(window.location.search);
    const siteKey = params.get('site');

    if (!siteKey) {
        // Fallback if no site specified
        window.location.href = "https://fintuno-extension.vercel.app/";
        return;
    }

    const state = await Storage.getSiteState(siteKey);
    const usageState = await Storage.getUsageState();

    if (state || usageState) {
        const dest = new URL("https://fintuno-extension.vercel.app/");
        dest.searchParams.set('site', (state && state.displayName) ? state.displayName : siteKey);
        dest.searchParams.set('isBlocked', state ? state.isBlocked : false);

        // Pass timestamps. If 0 or null, pass 0.
        dest.searchParams.set('blockedUntil', (state && state.blockedUntil) ? state.blockedUntil : 0);
        dest.searchParams.set('unblockUntil', (state && state.unblockUntil) ? state.unblockUntil : 0);

        // Pass daily limit reset time
        dest.searchParams.set('resetAt', usageState.nextReset);

        window.location.replace(dest.toString());
    } else {
        // Unknown site state, just redirect to app generic page
        window.location.replace(`https://fintuno-extension.vercel.app/?site=${encodeURIComponent(siteKey)}`);
    }
})();
