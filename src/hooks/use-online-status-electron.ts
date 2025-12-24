import { useState, useEffect } from 'react';

// Enhanced online status hook for Electron environment
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(() => {
    // Initial check
    if (typeof navigator !== 'undefined') {
      // Do a more aggressive initial check in Electron
      const isElectron = window.process && window.process.type;
      if (isElectron) {
        // In Electron, start with null (unknown) status
        // The network checker will determine the actual status
        console.log('[Initial Check] Electron: Starting with unknown status (will be updated by network checker)');
        return null;
      }
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') return;

    // Check if we're in Electron
    const isElectron = window.process && window.process.type;

    // For Electron, skip the immediate check since navigator.onLine is unreliable
    // The status will be updated by API failures/successes
    if (!isElectron) {
      // Perform an immediate check on mount for non-Electron browsers
      const immediateStatus = navigator.onLine;
      console.log(`[Immediate Check] Network status on mount: ${immediateStatus ? 'Online' : 'Offline'}`);
      setIsOnline(immediateStatus);
    }

    // Handle custom Electron network events
    const handleElectronNetworkStatus = (event: CustomEvent) => {
      const { isOnline: onlineStatus } = event.detail;
      console.log(`[Electron Event] Network status: ${onlineStatus ? 'Online' : 'Offline'}`);
      setIsOnline(onlineStatus);
    };

    if (isElectron) {
      console.log('[useOnlineStatus] Setting up Electron listeners (API failure-based only)...');
      // Only use custom electron-network-status events (from API failures)
      // Don't use browser's online/offline events - they're unreliable in Electron
      window.addEventListener('electron-network-status', handleElectronNetworkStatus as EventListener);

      return () => {
        console.log('[useOnlineStatus] Cleaning up Electron listeners...');
        window.removeEventListener('electron-network-status', handleElectronNetworkStatus as EventListener);
      };
    }

    // For non-Electron (browser), use standard online/offline events
    const handleOnline = () => {
      console.log('[Event] Network status: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[Event] Network status: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners for non-Electron
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Empty dependency array - only run once on mount

  // Return true if isOnline is null (loading state)
  // This ensures the app works while waiting for the first network check
  return isOnline === null ? true : isOnline;
}
