
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
        throw new Error('Firebase environment variables are not set. Cannot initialize Firebase Admin SDK.');
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

// --- Data Migration ---

async function runInitialDataMigration() {
    const firestore = getDb();
    const usersCollection = firestore.collection('users');
    const usersSnapshot = await usersCollection.get();

    // Only migrate data if the users collection is empty
    if (usersSnapshot.empty) {
        console.log('Running initial data migration...');
        const batch = firestore.batch();

        // Migrate Users
        usersData.forEach((user: User) => {
            const docRef = firestore.collection('users').doc(user.id);
            batch.set(docRef, user);
        });

        // Migrate Books
        booksData.forEach((book: Book) => {
            const docRef = firestore.collection('books').doc(book.id);
            batch.set(docRef, book);
        });
        
        // Migrate Histories
        historiesData.forEach((history: UserBorrowingHistory) => {
            const docRef = firestore.collection('histories').doc(history.userId);
            batch.set(docRef, history);
        });
        
        // Migrate Book Demands
        bookDemandsData.forEach((demand: BookDemand) => {
            const docRef = firestore.collection('bookDemands').doc(demand.id);
            batch.set(docRef, demand);
        });

        await batch.commit();
        console.log('Initial data migration completed.');
    }
}


// --- Generic Firestore Functions ---

async function getData<T>(collectionName: string): Promise<T[]> {
    await runInitialDataMigration();
    const firestore = getDb();
    try {
        const snapshot = await firestore.collection(collectionName).get();
        if (snapshot.empty) {
            console.log(`No documents found in ${collectionName} collection.`);
            return [];
        }
        return snapshot.docs.map(doc => doc.data() as T);
    } catch (error) {
        console.error(`Error getting data from ${collectionName}:`, error);
        // In case of error (e.g., permissions), return an empty array to avoid crashing the app
        return [];
    }
}

async function saveData<T extends { id: string }>(collectionName: string, data: T[]): Promise<void> {
    const firestore = getDb();
    try {
        const batch = firestore.batch();
        const collectionRef = firestore.collection(collectionName);
        
        for (const item of data) {
            if (!item.id) {
                console.warn(`Item in collection ${collectionName} has no ID. Skipping.`);
                continue;
            }
            const docRef = collectionRef.doc(item.id);
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
