
'use server';

import admin from 'firebase-admin';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import usersData from './data/users.json';
import booksData from './data/books.json';
import historiesData from './data/histories.json';
import bookDemandsData from './data/bookDemands.json';

// --- Firebase Admin SDK Singleton ---

let db: admin.firestore.Firestore;

function getDb(): admin.firestore.Firestore {
  if (db) {
    return db;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        // In a deployed environment, we expect these to be set.
        // In a local environment, the emulator is used.
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Firebase environment variables are not set. Cannot initialize Firebase Admin SDK.');
        }
        // For local dev, we can proceed assuming emulator is running or no firebase access is needed immediately.
        console.warn('Firebase environment variables not set. Assuming local development with emulator or delayed initialization.');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
       console.log('Firebase Admin SDK initialized successfully.');
    }
    db = admin.firestore();
    return db;
  } catch (error: any) {
     console.error('Firebase admin initialization error', error);
     // Avoid throwing hard error on startup, let calls fail instead.
     // This prevents Vercel from crashing on boot if env vars are missing.
  }
  // Return a dummy object if initialization fails to prevent crashes on import
  // Functions calling getDb must handle the possibility of a non-functional db object.
  return {} as admin.firestore.Firestore;
}


// --- Generic Firestore Functions ---

async function getData<T>(collectionName: string): Promise<T[]> {
    try {
        const firestore = getDb();
        if (!firestore.collection) {
             console.error(`Firestore not available for getting data from ${collectionName}`);
             return [];
        }
        const snapshot = await firestore.collection(collectionName).get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => doc.data() as T);
    } catch (error) {
        console.error(`Error getting data from ${collectionName}:`, error);
        return [];
    }
}

async function saveData<T extends { id?: string; userId?: string }>(collectionName: string, data: T[]): Promise<void> {
    const firestore = getDb();
    if (!firestore.batch) {
        console.error(`Firestore not available for saving data to ${collectionName}`);
        throw new Error(`Firestore not available`);
    }
    try {
        const batch = firestore.batch();
        const collectionRef = firestore.collection(collectionName);
        
        const snapshot = await collectionRef.get();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));

        for (const item of data) {
            const docId = item.id || item.userId;
            if (!docId) {
                console.warn(`Item in collection ${collectionName} has no ID/userId. Skipping.`);
                continue;
            }
            const docRef = collectionRef.doc(docId);
            batch.set(docRef, item);
        }
        
        await batch.commit();
    } catch (error) {
        console.error(`Error saving data to ${collectionName}:`, error);
        throw new Error(`Failed to save data to ${collectionName}.`);
    }
}

async function getDoc<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
        const firestore = getDb();
         if (!firestore.collection) {
             console.error(`Firestore not available for getting doc from ${collectionName}`);
             return null;
        }
        const docRef = firestore.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return docSnap.data() as T;
        }
        return null;
    } catch (error) {
        console.error(`Error getting document ${docId} from ${collectionName}:`, error);
        return null;
    }
}

async function setDoc<T>(collectionName: string, docId: string, data: T): Promise<void> {
     const firestore = getDb();
     if (!firestore.collection) {
        console.error(`Firestore not available for setting doc in ${collectionName}`);
        throw new Error('Firestore not available');
    }
    try {
        await firestore.collection(collectionName).doc(docId).set(data);
    } catch (error) {
        console.error(`Error setting document ${docId} in ${collectionName}:`, error);
        throw new Error(`Failed to set document in ${collectionName}.`);
    }
}


// --- Public Data Access Functions ---

export const getUsers = async (): Promise<User[]> => getData<User>('users');
export const getBooks = async (): Promise<Book[]> => getData<Book>('books');
export const getHistories = async (): Promise<UserBorrowingHistory[]> => getData<UserBorrowingHistory>('histories');
export const getBookDemands = async (): Promise<BookDemand[]> => getData<BookDemand>('bookDemands');
export const getUser = async (userId: string): Promise<User | null> => getDoc<User>('users', userId);
export const setUser = async (user: User) => setDoc<User>('users', user.id, user);


// --- Public Data Saving Functions ---

export const saveUsers = async (data: User[]) => saveData<User>('users', data);
export const saveBooks = async (data: Book[]) => saveData<Book>('books', data);
export const saveHistories = async (data: UserBorrowingHistory[]) => saveData<UserBorrowingHistory>('histories', data);
export const saveBookDemands = async (data: BookDemand[]) => saveData<BookDemand>('bookDemands', data);
