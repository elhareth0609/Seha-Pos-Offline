import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, fallbackData: T): [T, (value: T | ((val: T) => T)) => void] {
    // 1. Initialize state with fallback data to ensure server and client have the same initial render.
    // This prevents Next.js hydration errors.
    const [value, setValue] = useState<T>(fallbackData);

    // 2. On the client, after the component mounts, read the real value from localStorage.
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            // If a value exists in storage, parse it and update our state.
            if (item) {
                setValue(JSON.parse(item));
            }
        } catch (error) {
            // If parsing fails, we'll just stick with the fallbackData.
            console.error(`Error reading localStorage key “${key}”:`, error);
        }
    }, [key]);

    // 3. Whenever the state `value` changes, write it back to localStorage.
    // This effect is separate to avoid writing the initial fallbackData over existing stored data.
    useEffect(() => {
        try {
             window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
        }
    }, [key, value]);
    
    return [value, setValue];
}
