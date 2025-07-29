
import { doc, getDoc, setDoc, collection, getDocs, query, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Fetches a single document from a pharmacy's top-level collection (e.g., config)
export const getPharmacyDoc = async <T,>(pharmacyId: string, collectionName: string, docId: string): Promise<T | null> => {
  try {
    const docRef = doc(db, 'pharmacies', pharmacyId, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  } catch (error) {
    console.error(`Error reading doc "${docId}" from "${collectionName}" in pharmacy "${pharmacyId}":`, error);
    return null;
  }
};

// Sets a single document in a pharmacy's top-level collection
export const setPharmacyDoc = async <T,>(pharmacyId: string, collectionName: string, docId: string, data: T): Promise<void> => {
  try {
    const docRef = doc(db, 'pharmacies', pharmacyId, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Error writing doc "${docId}" to "${collectionName}" in pharmacy "${pharmacyId}":`, error);
    throw error;
  }
};

// Fetches all documents from a sub-collection within a pharmacy
export const getPharmacySubCollection = async <T,>(pharmacyId: string, collectionName: string): Promise<T[]> => {
  try {
    const collectionRef = collection(db, 'pharmacies', pharmacyId, collectionName);
    const q = query(collectionRef);
    const querySnapshot = await getDocs(q);
    const data: T[] = [];
    querySnapshot.forEach((doc) => {
      data.push({ ...doc.data(), id: doc.id } as T);
    });
    return data;
  } catch (error) {
    console.error(`Error reading from collection "${collectionName}" in pharmacy "${pharmacyId}":`, error);
    return [];
  }
};

// Sets a document in a sub-collection within a pharmacy
export const setPharmacySubCollectionDoc = async <T extends { id: string }>(
  pharmacyId: string,
  collectionName: string,
  documentId: string,
  data: Omit<T, 'id'>
): Promise<void> => {
  try {
    const docRef = doc(db, 'pharmacies', pharmacyId, collectionName, documentId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Error writing to sub-collection "${collectionName}" in pharmacy "${pharmacyId}":`, error);
    throw error;
  }
};

// Deletes a document from a sub-collection within a pharmacy
export const deletePharmacySubCollectionDoc = async (
  pharmacyId: string,
  collectionName: string,
  documentId: string
): Promise<void> => {
    try {
        const docRef = doc(db, 'pharmacies', pharmacyId, collectionName, documentId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting document from "${collectionName}" in pharmacy "${pharmacyId}":`, error);
        throw error;
    }
};

// Deletes an entire sub-collection. Use with caution.
export const deletePharmacySubCollection = async (pharmacyId: string, collectionName: string): Promise<void> => {
    const collectionRef = collection(db, 'pharmacies', pharmacyId, collectionName);
    const q = query(collectionRef);
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};

// Deletes all data associated with a pharmacy
export const deletePharmacyData = async (pharmacyId: string): Promise<void> => {
    const subCollections = ['inventory', 'sales', 'suppliers', 'patients', 'trash', 'payments', 'purchaseOrders', 'supplierReturns', 'timeLogs', 'config'];
    for (const collectionName of subCollections) {
        await deletePharmacySubCollection(pharmacyId, collectionName);
    }
};


// --- User Functions ---

// Fetches all user documents
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollectionRef);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
};

// Creates or updates a user document
export const setUser = async (userId: string, data: Omit<User, 'id'>): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, data, { merge: true });
  } catch (error) {
    console.error(`Error setting user ${userId}:`, error);
    throw error;
  }
};
