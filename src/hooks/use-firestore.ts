
"use client";

import { useState, useEffect, useRef } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  writeBatch as firestoreWriteBatch,
  enableNetwork,
  disableNetwork,
  terminate
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import type { DocumentData, QuerySnapshot, Unsubscribe } from 'firebase/firestore';

export const db = getFirestore(firebaseApp);

// Export firebase/firestore functions for direct use if needed
export { doc, writeBatch, deleteDoc, setDoc };


// --- HOOKS ---

// Hook to get a collection
export function useFirestoreCollection<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(collRef, (snapshot: QuerySnapshot<DocumentData>) => {
      const collectionData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
      setData(collectionData);
      setLoading(false);
    }, (error) => {
        console.error(`Error fetching collection ${collectionName}:`, error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName]);

  const add = async (newData: Omit<T, 'id'>) => {
    return await addDoc(collection(db, collectionName), newData);
  }

  const setData = async (id: string, newData: T) => {
    return await setDoc(doc(db, collectionName, id), newData);
  }

  return { data, loading, add, setData };
}

// Hook to get a single document
export function useFirestoreDocument<T>(collectionName: string, docId: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) {
        setLoading(false);
        return;
    };
    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data() as T);
      } else {
        setData(null);
      }
      setLoading(false);
    }, (error) => {
        console.error(`Error fetching document ${collectionName}/${docId}:`, error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, docId]);
  
  const set = async (newData: T) => {
    return await setDoc(doc(db, collectionName, docId), newData);
  }

  return { data, loading, set };
}

// Hook to track online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return isOnline;
}
