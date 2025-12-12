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

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // In Electron, we might need additional checks
    if (isElectron) {
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
