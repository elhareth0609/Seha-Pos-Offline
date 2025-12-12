import { useState, useEffect } from 'react';

// Enhanced online status hook for Electron environment
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // Initial check
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') return;

    // Check if we're in Electron
    const isElectron = window.process && window.process.type;
    
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
      
      // Periodically check connection status in Electron
      const checkInterval = setInterval(() => {
        const online = navigator.onLine;
        if (online !== isOnline) {
          setIsOnline(online);
        }
      }, 5000); // Check every 5 seconds

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
