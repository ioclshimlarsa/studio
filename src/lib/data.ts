
'use server';

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
    
    // Check if running on the server and if env vars are present
    if (process.env.FIREBASE_PROJECT_ID) {
        // Prevent re-initialization
        if (!admin.apps.length) {
            try {
                const projectId = process.env.FIREBASE_PROJECT_ID;
                const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
                const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

                if (!projectId || !clientEmail || !privateKey) {
                    console.log('Firebase environment variables are not fully set. Falling back to JSON data.');
                    return null;
                }

                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
                console.log('Firebase Admin SDK initialized successfully.');
            } catch (error: any) {
                console.error('Firebase admin initialization error, falling back to JSON data:', error.message);
                return null;
            }
        }
        db = admin.firestore();

        // Run data migration if needed, but don't block the return
        runInitialDataMigration(db).catch(error => {
            console.error('Error during initial data migration check:', error);
        });

        return db;
    }

    console.log('Firebase environment variables not found. Using JSON data as a fallback.');
    return null;
}

// --- In-memory fallback state ---
let localUsers: User[] = [...usersData];
let localBooks: Book[] = [...booksData];
let localHistories: UserBorrowingHistory[] = [...historiesData];
let localBookDemands: BookDemand[] = [...bookDemandsData];


// Initialize Firebase once when the module is loaded
const firestore = initializeFirebase();


async function runInitialDataMigration(fs: admin.firestore.Firestore) {
    if (!fs) return;
    try {
        const usersCollection = fs.collection('users');
        const usersSnapshot = await usersCollection.limit(1).get();
        if (usersSnapshot.empty) {
            console.log('Users collection is empty. Populating with initial data...');
            const batch = fs.batch();

            (usersData as User[]).forEach(user => {
                const docRef = fs.collection('users').doc(user.id);
                batch.set(docRef, user);
            });
            (booksData as Book[]).forEach(book => {
                const docRef = fs.collection('books').doc(book.id);
                batch.set(docRef, book);
            });
            (historiesData as UserBorrowingHistory[]).forEach(history => {
                const docRef = fs.collection('histories').doc(history.userId);
                batch.set(docRef, history);
            });
            (bookDemandsData as BookDemand[]).forEach(demand => {
                const docRef = fs.collection('bookDemands').doc(demand.id);
                batch.set(docRef, demand);
            });

            await batch.commit();
            console.log('Initial data migration completed successfully.');
        }
    } catch (error) {
        console.error('Error during initial data migration:', error);
    }
}

// --- Generic Data Functions ---

async function getData<T>(collectionName: string, fallbackData: T[]): Promise<T[]> {
    if (!firestore) {
        return Promise.resolve(fallbackData);
    }
    try {
        const snapshot = await firestore.collection(collectionName).get();
        if (snapshot.empty) {
            return fallbackData;
        }
        return snapshot.docs.map(doc => doc.data() as T);
    } catch (error) {
        console.error(`Error getting data from ${collectionName}, falling back to JSON:`, error);
        return fallbackData;
    }
}

// Overwrites an entire collection. Use with caution.
async function saveData<T extends { id?: string; userId?: string }>(collectionName: string, data: T[]): Promise<void> {
    if (!firestore) {
        if (collectionName === 'users') localUsers = data as User[];
        if (collectionName === 'books') localBooks = data as Book[];
        if (collectionName === 'histories') localHistories = data as UserBorrowingHistory[];
        if (collectionName === 'bookDemands') localBookDemands = data as BookDemand[];
        return;
    }
    try {
        const batch = firestore.batch();
        const collectionRef = firestore.collection(collectionName);
        
        const snapshot = await collectionRef.get();
        if(!snapshot.empty){
             snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
       
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


// Appends items to a collection without deleting existing ones.
async function appendData<T extends { id: string }>(collectionName: string, newData: T[]): Promise<void> {
    if (!firestore) {
         if (collectionName === 'books') {
            const bookIds = new Set(localBooks.map(b => b.id));
            const uniqueNewBooks = newData.filter(b => !bookIds.has(b.id as string));
            localBooks.push(...(uniqueNewBooks as Book[]));
        }
        return;
    }
    try {
        const batch = firestore.batch();
        const collectionRef = firestore.collection(collectionName);
        
        newData.forEach(item => {
            const docRef = collectionRef.doc(item.id);
            batch.set(docRef, item, { merge: true });
        });
        
        await batch.commit();
    } catch (error) {
        console.error(`Error appending data to ${collectionName}:`, error);
        throw new Error(`Failed to append data to ${collectionName}.`);
    }
}


// --- Public Data Access Functions ---

export const getUsers = async (): Promise<User[]> => getData<User>('users', localUsers);
export const getBooks = async (): Promise<Book[]> => getData<Book>('books', localBooks);
export const getHistories = async (): Promise<UserBorrowingHistory[]> => getData<UserBorrowingHistory>('histories', localHistories);
export const getBookDemands = async (): Promise<BookDemand[]> => getData<BookDemand>('bookDemands', localBookDemands);


// --- Public Data Saving Functions ---

export const saveUsers = async (data: User[]) => saveData<User>('users', data);
export const saveBooks = async (data: Book[]) => saveData<Book>('books', data);
export const saveHistories = async (data: UserBorrowingHistory[]) => saveData<UserBorrowingHistory>('histories', data);
export const saveBookDemands = async (data: BookDemand[]) => saveData<BookDemand>('bookDemands', data);
export const appendBooks = async (data: Book[]) => appendData<Book>('books', data);
