import { useState, useEffect } from 'react';

const DB_NAME = 'MedStockDB';
const DB_VERSION = 1;
const STORE_NAME = 'appData';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            // This promise will never resolve on the server, which is fine.
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'key' });
            }
        };
    });
    return dbPromise;
};

const getFromDB = async <T>(key: string): Promise<T | undefined> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
            resolve(request.result?.value);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
};

const setToDB = async (key: string, value: any): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ key, value });
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
};

export const clearAllDBData = async (): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
         request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

export const getAllDataForBackup = async (): Promise<{ [key: string]: any }> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const allItems = request.result; // This is an array of {key, value}
            const dataObject: { [key: string]: any } = {};
            allItems.forEach(item => {
                dataObject[item.key] = item.value;
            });
            resolve(dataObject);
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
};

export const importAllData = async (data: { [key: string]: any }): Promise<void> => {
    const db = await getDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear existing data first
    store.clear();

    // Then add all new data
    Object.keys(data).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            store.put({ key, value: data[key] });
        }
    });

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
};


export function useLocalStorage<T>(key: string, fallbackData: T): [T, (value: T | ((val: T) => T)) => void] {
    const [value, setValue] = useState<T>(fallbackData);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // This effect runs once on mount to fetch initial data from IndexedDB
        if (typeof window !== 'undefined') {
            getFromDB<T>(key).then(storedValue => {
                if (storedValue !== undefined) {
                    setValue(storedValue);
                }
            }).catch(error => {
                console.error(`Error reading IndexedDB key “${key}”:`, error);
            }).finally(() => {
                setIsInitialized(true);
            });
        }
    }, [key]);

    useEffect(() => {
        // This effect runs whenever `value` changes, to write back to IndexedDB.
        // It only runs after the initial value has been loaded from storage.
        if (isInitialized) {
             if (typeof window !== 'undefined') {
                setToDB(key, value).catch(error => {
                    console.error(`Error writing to IndexedDB key “${key}”:`, error);
                });
            }
        }
    }, [key, value, isInitialized]);
    
    return [value, setValue];
}
