
'use server';

import admin from 'firebase-admin';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import usersData from './data/users.json';
import booksData from './data/books.json';
import historiesData from './data/histories.json';
import bookDemandsData from './data/bookDemands.json';

// --- Firebase Admin SDK Singleton ---

let db: admin.firestore.Firestore;
let migrationPromise: Promise<void> | null = null;

function getDb(): admin.firestore.Firestore {
  if (db) {
    return db;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase environment variables are not set.');
      }
      console.warn('Firebase environment variables not set. Assuming local development.');
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
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}

// --- Initial Data Migration ---
async function runInitialDataMigration() {
    const firestore = getDb();
    if (!firestore.collection) {
        console.error("Firestore not available, skipping data migration.");
        return;
    }

    try {
        const usersCollection = firestore.collection('users');
        const usersSnapshot = await usersCollection.get();
        if (usersSnapshot.empty) {
            console.log('Users collection is empty. Populating with initial data...');
            const batch = firestore.batch();

            (usersData as User[]).forEach(user => {
                const docRef = firestore.collection('users').doc(user.id);
                batch.set(docRef, user);
            });
            (booksData as Book[]).forEach(book => {
                const docRef = firestore.collection('books').doc(book.id);
                batch.set(docRef, book);
            });
            (historiesData as UserBorrowingHistory[]).forEach(history => {
                const docRef = firestore.collection('histories').doc(history.userId);
                batch.set(docRef, history);
            });
            (bookDemandsData as BookDemand[]).forEach(demand => {
                const docRef = firestore.collection('bookDemands').doc(demand.id);
                batch.set(docRef, demand);
            });

            await batch.commit();
            console.log('Initial data migration completed successfully.');
        }
    } catch (error) {
        console.error('Error during initial data migration:', error);
        // Do not re-throw, as this might crash the server on startup in some environments.
    }
}


// --- Generic Firestore Functions ---

async function getData<T>(collectionName: string): Promise<T[]> {
    if (!migrationPromise) {
        migrationPromise = runInitialDataMigration();
    }
    await migrationPromise;
    
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

// --- Public Data Access Functions ---

export const getUsers = async (): Promise<User[]> => getData<User>('users');
export const getBooks = async (): Promise<Book[]> => getData<Book>('books');
export const getHistories = async (): Promise<UserBorrowingHistory[]> => getData<UserBorrowingHistory>('histories');
export const getBookDemands = async (): Promise<BookDemand[]> => getData<BookDemand>('bookDemands');


// --- Public Data Saving Functions ---

export const saveUsers = async (data: User[]) => saveData<User>('users', data);
export const saveBooks = async (data: Book[]) => saveData<Book>('books', data);
export const saveHistories = async (data: UserBorrowingHistory[]) => saveData<UserBorrowingHistory>('histories', data);
export const saveBookDemands = async (data: BookDemand[]) => saveData<BookDemand>('bookDemands', data);
