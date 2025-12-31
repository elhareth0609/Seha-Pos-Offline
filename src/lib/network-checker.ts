// Network checker utility for Electron environment
// This module provides reliable network status checking using actual HTTP requests

let intervalId: number | null = null;
let lastKnownStatus: boolean | null = null;

// Check network status by making actual HTTP requests
const checkNetworkStatus = async () => {
  try {
    // Try to fetch a small resource with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    // Use reliable endpoints for connectivity check
    const endpoint = 'https://backend-uat.midgram.net/api/health';

    let isOnline = false;
      try {
        const response = await fetch(endpoint, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-store'
        });
        // If we get here, the request didn't throw, so we have some connectivity
        isOnline = true;
      } catch (e) {
        // Try next endpoint
        console.log("e" + e)
      }

    clearTimeout(timeoutId);

    // Only dispatch event if status changed
    if (lastKnownStatus !== isOnline) {
      console.log(`[Network Check] Status changed: ${isOnline ? 'Online' : 'Offline'}`);
      lastKnownStatus = isOnline;

      // Dispatch a custom event to notify about network status changes
      window.dispatchEvent(new CustomEvent('electron-network-status', {
        detail: { isOnline }
      }));

      // Also dispatch standard events for compatibility
      if (isOnline) {
        window.dispatchEvent(new Event('online'));
      } else {
        window.dispatchEvent(new Event('offline'));
      }
    }
  } catch (error) {
    // If all checks fail, we're offline
    if (lastKnownStatus !== false) {
      console.log('[Network Check] All endpoints failed - going offline');
      lastKnownStatus = false;

      window.dispatchEvent(new CustomEvent('electron-network-status', {
        detail: { isOnline: false }
      }));
      window.dispatchEvent(new Event('offline'));
    }
  }
};

// Start periodic network checks
export const startNetworkChecks = () => {
  // Check if we're in an Electron environment
  const isElectron = typeof window !== 'undefined' && window.process && window.process.type;

  if (isElectron) {
    console.log('[Network Checker] Starting periodic network checks...');

    // Clear any existing interval
    if (intervalId !== null) {
      clearInterval(intervalId);
    }

    // Check network status every 5 seconds
    intervalId = window.setInterval(checkNetworkStatus, 5000);

    // Initial check
    checkNetworkStatus();

    // Clean up interval on page unload
    window.addEventListener('beforeunload', () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    });
  }
};

// Stop periodic network checks
export const stopNetworkChecks = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Network Checker] Stopped periodic network checks');
  }
};

// Manually trigger a network check
export const checkNetwork = () => {
  checkNetworkStatus();
};
