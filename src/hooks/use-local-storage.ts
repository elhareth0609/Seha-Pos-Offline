import { useState, useEffect } from 'react';

function loadInitialData<T>(key: string, fallbackData: T): T {
    if (typeof window === "undefined") {
      return fallbackData;
    }
    try {
      const savedData = window.localStorage.getItem(key);
      return savedData ? JSON.parse(savedData) : fallbackData;
    } catch (error) {
      console.error(`Failed to load data for key "${key}" from localStorage.`, error);
      return fallbackData;
    }
}

export function useLocalStorage<T>(key: string, fallbackData: T): [T, (value: T | ((val: T) => T)) => void] {
    const [value, setValue] = useState<T>(() => loadInitialData(key, fallbackData));

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Failed to save data for key "${key}" to localStorage.`, error);
        }
    }, [key, value]);
    
    return [value, setValue];
}
