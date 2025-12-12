// Electron storage utilities
// This module provides a fallback for localStorage in Electron

interface ElectronStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// Check if we are in an Electron environment
const isElectron = typeof window !== 'undefined' && window.process && window.process.type;

// Create a storage interface that works in both browser and Electron
export const electronStorage: ElectronStorage = {
  getItem(key: string): string | null {
    if (isElectron) {
      // In Electron, we might need to use a different storage mechanism
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error accessing localStorage in Electron:', error);
        return null;
      }
    } else {
      return localStorage.getItem(key);
    }
  },

  setItem(key: string, value: string): void {
    if (isElectron) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting localStorage in Electron:', error);
      }
    } else {
      localStorage.setItem(key, value);
    }
  },

  removeItem(key: string): void {
    if (isElectron) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage in Electron:', error);
      }
    } else {
      localStorage.removeItem(key);
    }
  },

  clear(): void {
    if (isElectron) {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing localStorage in Electron:', error);
      }
    } else {
      localStorage.clear();
    }
  }
};
