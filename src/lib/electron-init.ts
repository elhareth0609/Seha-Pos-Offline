// Electron initialization utilities
// This module provides initialization functions for Electron environment

// Initialize localStorage in Electron environment
export const initElectronStorage = () => {
  // Check if we are in an Electron environment
  const isElectron = typeof window !== 'undefined' && window.process && window.process.type;
  
  if (isElectron) {
    console.log('Initializing Electron storage...');
    
    // Ensure localStorage is available
    try {
      // Test localStorage
      localStorage.setItem('__electron_test__', 'test');
      localStorage.removeItem('__electron_test__');
      console.log('localStorage is available in Electron');
    } catch (error) {
      console.error('localStorage is not available in Electron:', error);
      
      // Create a fallback storage mechanism
      const electronStorageFallback = {
        _data: {},
        setItem(key, value) {
          this._data[key] = value;
        },
        getItem(key) {
          return this._data[key] || null;
        },
        removeItem(key) {
          delete this._data[key];
        },
        clear() {
          this._data = {};
        }
      };
      
      // Override localStorage with our fallback
      Object.defineProperty(window, 'localStorage', {
        value: electronStorageFallback,
        writable: true
      });
      
      console.log('Using fallback storage in Electron');
    }
  }
};

// Initialize network status in Electron environment
export const initElectronNetwork = () => {
  // Check if we are in an Electron environment
  const isElectron = typeof window !== 'undefined' && window.process && window.process.type;
  
  if (isElectron) {
    console.log('Initializing Electron network status...');
    
    // Set up periodic network checks
    const checkNetworkStatus = () => {
      const isOnline = navigator.onLine;
      console.log(`Network status: ${isOnline ? 'Online' : 'Offline'}`);
      
      // Dispatch a custom event to notify about network status changes
      window.dispatchEvent(new CustomEvent('electron-network-status', { 
        detail: { isOnline } 
      }));
    };
    
    // Check network status every 5 seconds
    setInterval(checkNetworkStatus, 5000);
    
    // Initial check
    checkNetworkStatus();
  }
};
