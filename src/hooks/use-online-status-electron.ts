import { useState, useEffect } from 'react';

// Enhanced online status hook for Electron environment
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // Initial check
    if (typeof navigator !== 'undefined') {
      // Do a more aggressive initial check in Electron
      const isElectron = window.process && window.process.type;
      if (isElectron) {
        // In Electron, do an immediate check with a small delay to ensure accurate status
        setTimeout(() => {
          const status = navigator.onLine;
          console.log(`[Initial Check] Network status: ${status ? 'Online' : 'Offline'}`);
          setIsOnline(status);
        }, 100);
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
    
    // Perform an immediate check on mount
    const immediateStatus = navigator.onLine;
    console.log(`[Immediate Check] Network status on mount: ${immediateStatus ? 'Online' : 'Offline'}`);
    setIsOnline(immediateStatus);

    // Set up event listeners
    const handleOnline = () => {
      console.log('Network status: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network status: Offline');
      setIsOnline(false);
    };

    // Handle custom Electron network events
    const handleElectronNetworkStatus = (event: CustomEvent) => {
      const { isOnline: onlineStatus } = event.detail;
      console.log(`Electron network status: ${onlineStatus ? 'Online' : 'Offline'}`);
      setIsOnline(onlineStatus);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (isElectron) {
      window.addEventListener('electron-network-status', handleElectronNetworkStatus as EventListener);

      // Periodically check connection status in Electron with more frequent checks
      const checkInterval = setInterval(() => {
        const navigatorOnline = window.navigator.onLine; // Check directly from navigator
        if (navigatorOnline !== isOnline) {
          console.log(`[Network Check] Status changed to: ${navigatorOnline ? 'Online' : 'Offline'}`);
          setIsOnline(navigatorOnline);
          
          // Dispatch a custom event to notify other components
          window.dispatchEvent(new CustomEvent('electron-network-status', {
            detail: { isOnline: navigatorOnline }
          }));
        }
      }, 1000); // Check every 1 second for more responsiveness

      return () => {
        clearInterval(checkInterval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('electron-network-status', handleElectronNetworkStatus as EventListener);
      };
    }

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return isOnline;
}
