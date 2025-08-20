
'use server';

import { db } from './firebase';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';

// Import the initial data directly for the one-time migration.
import initialUsers from './data/users.json';
import initialBooks from './data/books.json';
import initialHistories from './data/histories.json';
import initialBookDemands from './data/bookDemands.json';

// A simple in-memory flag to prevent re-running the migration on every server restart in dev mode.
let migrationHasRun = false;

async function runInitialDataMigration() {
    if (migrationHasRun) return;

    console.log("Checking if initial data migration is needed...");

    const migrationCheckRef = db.collection('app-metadata').doc('migration-status');
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

    const batch = db.batch();

    for (const collectionName in collections) {
        const data = collections[collectionName];
        const collectionRef = db.collection(collectionName);
        console.log(`Migrating ${data.length} documents to ${collectionName}...`);
        data.forEach((doc) => {
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
        // This is a critical error, but we'll allow the app to continue.
        // It might be that another instance is also running the migration.
    } finally {
        migrationHasRun = true;
    }
}


// --- Generic Firestore Functions ---

async function getData<T>(collectionName: string): Promise<T[]> {
    await runInitialDataMigration();
    try {
        const snapshot = await db.collection(collectionName).get();
        if (snapshot.empty) {
            console.log(`No documents found in ${collectionName} collection.`);
            return [];
        }
        return snapshot.docs.map(doc => doc.data() as T);
    } catch (error) {
        console.error(`Error getting data from ${collectionName}:`, error);
        // Fallback or re-throw as per application needs
        return [];
    }
}

async function saveData<T extends { id: string }>(collectionName: string, data: T[]): Promise<void> {
    try {
        const batch = db.batch();
        const collectionRef = db.collection(collectionName);

        // First, get all existing docs to find which ones to delete
        const snapshot = await collectionRef.get();
        const existingIds = new Set(snapshot.docs.map(doc => doc.id));
        const newDataIds = new Set(data.map(item => item.id));

        // Set/update new data
        for (const item of data) {
            const docRef = collectionRef.doc(item.id);
            batch.set(docRef, item);
        }

        // Delete documents that are not in the new data array
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
