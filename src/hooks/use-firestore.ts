
import { doc, getDoc, setDoc, collection, getDocs, query, writeBatch, deleteDoc, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

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
// export const setPharmacyDoc = async <T,>(pharmacyId: string, collectionName: string, docId: string, data: T): Promise<void> => {
//   try {
//     const docRef = doc(db, 'pharmacies', pharmacyId, collectionName, docId);
//     await setDoc(docRef, data, { merge: true });
//   } catch (error) {
//     console.error(`Error writing doc "${docId}" to "${collectionName}" in pharmacy "${pharmacyId}":`, error);
//     throw error;
//   }
// };
// Sets a single document in a pharmacy's top-level collection
export const setPharmacyDoc = async <T,>(pharmacyId: string, collectionName: string, docId: string, data: T): Promise<void> => {
  try {
    const docRef = doc(db, 'pharmacies', pharmacyId, collectionName, docId);
    // Add type assertion to ensure compatibility with Firestore
    await setDoc(docRef, data as any, { merge: true });
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
// export const setUser = async (
//   userId: string,
//   data: Omit<User, 'id'>,
//   superAdminAlreadyExists: boolean | undefined
// ): Promise<void> => {
//   try {
//     const userDocRef = doc(db, 'users', userId);
//     await setDoc(userDocRef, data, { merge: true });

//     // If SuperAdmin does NOT already exist, mark it as now existing
//     if (!superAdminAlreadyExists && data.role === 'SuperAdmin') {
//       await setDoc(doc(db, 'app_meta/super_admin'), { exists: true });
//     }
//   } catch (error) {
//     console.error(`Error setting user ${userId}:`, error);
//     throw error;
//   }
// };
// Creates or updates a user document
export const setUser = async (
  userId: string,
  data: Omit<User, 'id'>,
  superAdminAlreadyExists: boolean | undefined
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    // Add type assertion to ensure compatibility with Firestore
    await setDoc(userDocRef, data as any, { merge: true });

    // If SuperAdmin does NOT already exist, mark it as now existing
    if (!superAdminAlreadyExists && data.role === 'SuperAdmin') {
      await setDoc(doc(db, 'app_meta/super_admin'), { exists: true });
    }
  } catch (error) {
    console.error(`Error setting user ${userId}:`, error);
    throw error;
  }
};



/**
 * Check if a SuperAdmin exists in the system (for setup check)
 * This is the only function that can be called without authentication
 */
export async function checkSuperAdminExists(): Promise<boolean> {
  try {
    const superAdminMetaRef = doc(db, 'app_meta/super_admin');
    const superAdminMetaSnap = await getDoc(superAdminMetaRef);

    return superAdminMetaSnap.exists() && superAdminMetaSnap.data()?.exists === true;
  } catch (error) {
    console.error('Error checking SuperAdmin existence:', error);
    return false;
  }
}

/**
 * Get a specific user by ID (only after authentication)
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}



/**
 * Fetches all relevant data for backup from Firestore for a specific pharmacy.
 * @param pharmacyId The ID of the pharmacy to backup data for.
 * @returns An object containing data categorized by collection name.
 */
export const getAllDataForBackupFirestore = async (pharmacyId: string): Promise<object> => {
    const backupData: { [key: string]: any[] } = {};
    // Define the collections to backup. These should be sub-collections directly under 'pharmacies/{pharmacyId}'
    const collectionsToBackup = [
        'inventory', 'sales', 'suppliers', 'patients', 'trash', 'payments',
        'purchaseOrders', 'supplierReturns', 'timeLogs', 'config'
    ];

    for (const collectionName of collectionsToBackup) {
        backupData[collectionName] = await getPharmacySubCollectionData(pharmacyId, collectionName);
    }
    return backupData;
};

/**
 * Imports data into Firestore for a specific pharmacy, overwriting existing data.
 * @param pharmacyId The ID of the pharmacy to import data into.
 * @param data The object containing data to import, categorized by collection name.
 */
export const importAllDataFirestore = async (pharmacyId: string, data: object): Promise<void> => {
    const batch = writeBatch(db);

    for (const collectionName in data) {
        if (Object.prototype.hasOwnProperty.call(data, collectionName)) {
            const documents = (data as { [key: string]: any[] })[collectionName];

            // 1. Clear existing data in the collection to ensure a clean overwrite
            await clearPharmacySubCollection(pharmacyId, collectionName);

            // 2. Add new data from the backup file
            for (const docData of documents) {
                // Ensure each document has an 'id' field that corresponds to Firestore doc ID
                const docId = docData.id;
                // Remove 'id' from docData before setting, as it's used as doc ID in Firestore
                const { id, ...dataWithoutId } = docData;
                const docRef = doc(db, 'pharmacies', pharmacyId, collectionName, docId);
                // Use set with merge: false to completely overwrite the document
                batch.set(docRef, dataWithoutId, { merge: false });
            }
        }
    }
    await batch.commit();
};


// Helper function to delete all documents from a subcollection
const clearPharmacySubCollection = async (pharmacyId: string, collectionName: string): Promise<void> => {
    const collectionRef = collection(db, 'pharmacies', pharmacyId, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
    });
    await batch.commit();
};


// Helper function to get all documents from a subcollection for a given pharmacy
const getPharmacySubCollectionData = async <T,>(pharmacyId: string, collectionName: string): Promise<T[]> => {
    try {
        const collectionRef = collection(db, 'pharmacies', pharmacyId, collectionName);
        const querySnapshot = await getDocs(collectionRef);
        const data: T[] = [];
        querySnapshot.forEach((docSnap) => {
            // Include doc.id in the data for backup purposes
            data.push({ ...docSnap.data(), id: docSnap.id } as T);
        });
        return data;
    } catch (error) {
        console.error(`Error reading from collection "${collectionName}" for backup:`, error);
        return [];
    }
};
