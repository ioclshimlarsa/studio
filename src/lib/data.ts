
'use server';

import admin from 'firebase-admin';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import { config } from 'dotenv';

// These imports are needed to register the flows with Genkit
import '@/ai/flows/generate-personalized-reminder.ts';
import '@/ai/flows/generate-welcome-email.ts';

config(); 

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


// --- Generic Firestore Functions ---

async function getData<T>(collectionName: string): Promise<T[]> {
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

        // Get all existing document IDs in the collection
        const snapshot = await collectionRef.get();
        const existingIds = new Set(snapshot.docs.map(doc => doc.id));
        const newDataIds = new Set(data.map(item => item.id));

        // Set/update documents from the new data array
        for (const item of data) {
            if (!item.id) {
                console.warn(`Item in collection ${collectionName} has no ID. Skipping.`);
                continue;
            }
            const docRef = collectionRef.doc(item.id);
            batch.set(docRef, item);
        }

        // Delete documents that are in Firestore but not in the new data array
        for (const id of existingIds) {
            if (!newDataIds.has(id)) {
                const docRef = collectionRef.doc(id);
                batch.delete(docRef);
            }
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
