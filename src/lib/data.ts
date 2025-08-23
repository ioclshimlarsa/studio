
'use server';

import admin from 'firebase-admin';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import { config } from 'dotenv';

// These imports are needed to register the flows with Genkit
import '@/ai/flows/generate-personalized-reminder.ts';
import '@/ai/flows/generate-welcome-email.ts';

// Import the initial data directly for the one-time migration.
import initialUsers from './data/users.json';
import initialBooks from './data/books.json';
import initialHistories from './data/histories.json';
import initialBookDemands from './data/bookDemands.json';

config(); // Load environment variables from .env file

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

// A simple in-memory flag to prevent re-running the migration on every server restart in dev mode.
let migrationHasRun = false;

async function runInitialDataMigration() {
    if (migrationHasRun) return;

    const firestore = getDb();
    console.log("Checking if initial data migration is needed...");

    const migrationCheckRef = firestore.collection('app-metadata').doc('migration-status');
    const migrationDoc = await migrationCheckRef.get();

    if (migrationDoc.exists && migrationDoc.data()?.migrated === true) {
        console.log("Data migration has already been completed.");
        migrationHasRun = true;
        return;
    }

    console.log("Starting one-time data migration from JSON files to Firestore...");

    const collections: { [key: string]: any[] } = {
        users: initialUsers,
        books: initialBooks,
        histories: initialHistories,
        bookDemands: initialBookDemands,
    };

    const batch = firestore.batch();

    for (const collectionName in collections) {
        const data = collections[collectionName];
        const collectionRef = firestore.collection(collectionName);
        console.log(`Migrating ${data.length} documents to ${collectionName}...`);
        data.forEach((doc) => {
            if (!doc.id) {
                console.warn(`Document in ${collectionName} is missing an ID. Skipping.`);
                return;
            }
            const docRef = collectionRef.doc(doc.id);
            batch.set(docRef, doc);
        });
    }

    // Mark the migration as complete
    batch.set(migrationCheckRef, { migrated: true, timestamp: new Date() });

    try {
        await batch.commit();
        console.log("One-time data migration successful!");
    } catch (error) {
        console.error("FATAL: Error during data migration:", error);
    } finally {
        migrationHasRun = true;
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
        return [];
    }
}

async function saveData<T extends { id: string }>(collectionName: string, data: T[]): Promise<void> {
    const firestore = getDb();
    try {
        const batch = firestore.batch();
        const collectionRef = firestore.collection(collectionName);

        const snapshot = await collectionRef.get();
        const existingIds = new Set(snapshot.docs.map(doc => doc.id));
        const newDataIds = new Set(data.map(item => item.id));

        for (const item of data) {
            const docRef = collectionRef.doc(item.id);
            batch.set(docRef, item);
        }

        for (const id of existingIds) {
            if (!newDataIds.has(id)) {
                const docRef = collectionRef.doc(id);
                batch.delete(docRef);
            }
        }
        
        await batch.commit();
    } catch (error) {
        console.error(`Error saving data to ${collectionName}:`, error);
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
