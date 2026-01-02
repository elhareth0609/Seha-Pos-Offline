// Network checker utility for Electron environment
// This module provides reliable network status checking using actual HTTP requests

let intervalId: number | null = null;
let lastKnownStatus: boolean | null = null;
let currentCheckController: AbortController | null = null;
let isChecking = false;

// Check network status by making actual HTTP requests
const checkNetworkStatus = async () => {
  // Prevent overlapping checks
  if (isChecking) {
    console.log('[Network Check] Skipping - check already in progress');
    return;
  }

  // Abort any ongoing check
  if (currentCheckController) {
    currentCheckController.abort();
  }

  isChecking = true;
  currentCheckController = new AbortController();

  try {
    // Define multiple reliable endpoints
    const endpoints = [
      'https://backend.midgram.net/api/health',
      'https://clients3.google.com/generate_204', // Google's connectivity check
      'https://www.google.com/favicon.ico'        // Highly available static asset
    ];

    const checkEndpoint = async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      // Link to the main controller so it can be aborted
      currentCheckController?.signal.addEventListener('abort', () => {
        controller.abort();
      });

      try {
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-store'
        });
        console.log(`[Network Check] Success: ${url}`);
        return true;
      } catch (e: any) {
        // Don't log aborted requests - they're intentional
        if (e.name !== 'AbortError') {
          console.warn(`[Network Check] Failed: ${url} - ${e.message}`);
        }
        throw e;
      } finally {
        clearTimeout(timeoutId);
      }
    };

  let isOnline = false;

  // Polyfill-like behavior for Promise.any since lib might be older than ES2021
  const promiseAny = <T>(promises: Promise<T>[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      let rejectedCount = 0;
      if (promises.length === 0) {
        reject(new Error('No endpoints'));
        return;
      }
      promises.forEach(p => {
        p.then(resolve).catch(() => {
          rejectedCount++;
          if (rejectedCount === promises.length) reject(new Error('All rejected'));
        });
      });
    });
  };

    try {
      // Check if any endpoint returns success
      await promiseAny(endpoints.map(checkEndpoint));
      isOnline = true;
    } catch (error) {
      // All promises rejected
      isOnline = false;
    }

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
  } finally {
    isChecking = false;
    currentCheckController = null;
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

export const getLastKnownStatus = () => lastKnownStatus;

// Manually trigger a network check
export const checkNetwork = () => {
  checkNetworkStatus();
};
