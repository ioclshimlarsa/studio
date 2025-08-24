
import admin from 'firebase-admin';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import usersData from './data/users.json';
import booksData from './data/books.json';
import historiesData from './data/histories.json';
import bookDemandsData from './data/bookDemands.json';

// --- Firebase Admin SDK Singleton ---

let db: admin.firestore.Firestore | null = null;

function initializeFirebase(): admin.firestore.Firestore | null {
  if (db) {
    return db;
  }
  // Only initialize firebase if credentials are provided
  if (process.env.FIREBASE_PROJECT_ID) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        // Gracefully return null if credentials are not fully set
        // This allows the app to run in a local environment without firebase
        console.log('Firebase environment variables are not fully set. Falling back to JSON data.');
        return null;
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
      console.error('Firebase admin initialization error, falling back to JSON data:', error.message);
      // Do not throw here to allow fallback to JSON
      return null;
    }
  }
  // If no credentials, return null
  console.log('Firebase environment variables not found. Using JSON data as a fallback.');
  return null;
}

const firestore = initializeFirebase();

async function runInitialDataMigration(firestore: admin.firestore.Firestore) {
    if (!firestore) return;
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
    }
}

// Run migration once on startup if using firebase
if (firestore) {
    runInitialDataMigration(firestore);
}

// --- Generic Data Functions ---

async function getData<T>(collectionName: string, fallbackData: T[]): Promise<T[]> {
    if (!firestore) {
        return Promise.resolve(fallbackData);
    }
    try {
        const snapshot = await firestore.collection(collectionName).get();
        // NOTE: Firestore doesn't return data if the collection was created but is empty.
        // We will only fallback to local data if the database connection itself failed.
        // A truly empty collection should return an empty array.
        if (snapshot.empty) {
            // Check if the fallback data should be used instead
            const metadataDoc = await firestore.collection('internal_metadata').doc('data_state').get();
            if (!metadataDoc.exists) {
                 // This indicates that data has never been successfully written, so we can use fallback.
                 return fallbackData;
            }
        }
        return snapshot.docs.map(doc => doc.data() as T);
    } catch (error) {
        console.error(`Error getting data from ${collectionName}, falling back to JSON:`, error);
        return fallbackData; // Fallback on error
    }
}


async function saveData<T extends { id?: string; userId?: string }>(collectionName: string, data: T[], fallbackFn: (data: T[]) => void): Promise<void> {
    if (!firestore) {
        fallbackFn(data); // In-memory update for JSON
        return;
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
        
        // Mark that data has been written
        const metadataRef = firestore.collection('internal_metadata').doc('data_state');
        batch.set(metadataRef, { lastUpdated: new Date().toISOString() });
        
        await batch.commit();
    } catch (error) {
        console.error(`Error saving data to ${collectionName}:`, error);
        throw new Error(`Failed to save data to ${collectionName}.`);
    }
}


// --- In-memory fallback state ---
let localUsers: User[] = [...usersData];
let localBooks: Book[] = [...booksData];
let localHistories: UserBorrowingHistory[] = [...historiesData];
let localBookDemands: BookDemand[] = [...bookDemandsData];


// --- Public Data Access Functions ---

export const getUsers = (): Promise<User[]> => getData<User>('users', localUsers);
export const getBooks = (): Promise<Book[]> => getData<Book>('books', localBooks);
export const getHistories = (): Promise<UserBorrowingHistory[]> => getData<UserBorrowingHistory>('histories', localHistories);
export const getBookDemands = (): Promise<BookDemand[]> => getData<BookDemand>('bookDemands', localBookDemands);


// --- Public Data Saving Functions ---

export const saveUsers = (data: User[]) => saveData<User>('users', data, (d) => { localUsers = d; });
export const saveBooks = (data: Book[]) => saveData<Book>('books', data, (d) => { localBooks = d; });
export const saveHistories = (data: UserBorrowingHistory[]) => saveData<UserBorrowingHistory>('histories', data, (d) => { localHistories = d; });
export const saveBookDemands = (data: BookDemand[]) => saveData<BookDemand>('bookDemands', data, (d) => { localBookDemands = d; });
