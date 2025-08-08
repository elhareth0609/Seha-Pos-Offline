// import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
// // import { db } from './firebase';

// type StorageType = 'localStorage' | 'sessionStorage';

// const getStorage = (type: StorageType) => {
//     // Return a dummy storage object in non-browser environments
//     if (typeof window === 'undefined') {
//         return {
//             getItem: () => null,
//             setItem: () => {},
//             removeItem: () => {},
//         };
//     }
//     return type === 'localStorage' ? window.localStorage : window.sessionStorage;
// };


// // Generic function to get a value from storage
// export const getFromStorage = async <T,>(
//   key: string,
//   fallback: T,
//   storageType: StorageType = 'localStorage'
// ): Promise<T> => {
//   const storage = getStorage(storageType);
//   const item = storage.getItem(key);
//   return item ? JSON.parse(item) : fallback;
// };

// // Generic function to set a value in storage
// export const setInStorage = async <T,>(
//   key: string,
//   value: T,
//   storageType: StorageType = 'localStorage'
// ): Promise<void> => {
//     const storage = getStorage(storageType);
//     if (value === null || value === undefined) {
//         storage.removeItem(key);
//     } else {
//         storage.setItem(key, JSON.stringify(value));
//     }
// };

// // --- Firestore Functions ---

// export const getCollectionData = async <T,>(collectionName: string): Promise<T[]> => {
//   try {
//     const collectionRef = collection(db, collectionName);
//     const q = query(collectionRef);
//     const querySnapshot = await getDocs(q);
//     const data: T[] = [];
//     querySnapshot.forEach((doc) => {
//       data.push({ ...doc.data(), id: doc.id } as T);
//     });
//     return data;
//   } catch (error) {
//     console.error(`Error reading from collection "${collectionName}":`, error);
//     return [];
//   }
// };

// export const setDocumentInCollection = async <T extends { id: string }>(
//   collectionName: string, 
//   documentId: string, 
//   data: Omit<T, 'id'>
// ): Promise<void> => {
//   try {
//     const docRef = doc(db, collectionName, documentId);
//     await setDoc(docRef, {
//       ...data,
//       updatedAt: new Date().toISOString()
//     }, { merge: true });
//   } catch (error) {
//     console.error(`Error writing to collection "${collectionName}":`, error);
//     throw error;
//   }
// };

// export const deleteDocumentFromCollection = async (collectionName: string, documentId: string): Promise<void> => {
//     try {
//         const docRef = doc(db, collectionName, documentId);
//         await deleteDoc(docRef);
//     } catch (error) {
//         console.error(`Error deleting document from "${collectionName}":`, error);
//         throw error;
//     }
// };
