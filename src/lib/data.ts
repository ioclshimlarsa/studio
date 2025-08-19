
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';

// Use a singleton pattern to cache data in memory after the first read.
// This is more efficient than reading from the filesystem on every request.
const getInMemoryCache = (() => {
    let cache: { [key: string]: any } = {};
    let isInitialized = false;

    const initializeCache = async () => {
        if (isInitialized) return;

        // Correctly locate the data directory.
        const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');

        try {
            const usersData = await fs.readFile(path.join(dataDir, 'users.json'), 'utf-8');
            cache['users.json'] = JSON.parse(usersData);
        } catch (e) {
            console.error("Failed to load users.json, starting with empty array", e);
            cache['users.json'] = [];
        }

        try {
            const booksData = await fs.readFile(path.join(dataDir, 'books.json'), 'utf-8');
            cache['books.json'] = JSON.parse(booksData);
        } catch (e) {
            console.error("Failed to load books.json, starting with empty array", e);
            cache['books.json'] = [];
        }
        
        try {
            const historiesData = await fs.readFile(path.join(dataDir, 'histories.json'), 'utf-8');
            cache['histories.json'] = JSON.parse(historiesData);
        } catch(e) {
            console.error("Failed to load histories.json, starting with empty array", e);
            cache['histories.json'] = [];
        }

        try {
            const bookDemandsData = await fs.readFile(path.join(dataDir, 'bookDemands.json'), 'utf-8');
            cache['bookDemands.json'] = JSON.parse(bookDemandsData);
        } catch (e) {
            console.error("Failed to load bookDemands.json, starting with empty array", e);
            cache['bookDemands.json'] = [];
        }

        isInitialized = true;
    };

    return {
        get: async (key: string) => {
            if (!isInitialized) await initializeCache();
            // Return a deep copy to prevent accidental mutation of the cache
            return JSON.parse(JSON.stringify(cache[key]));
        },
        set: async (key: string, value: any) => {
            if (!isInitialized) await initializeCache();
            cache[key] = value;
            // Also write it back to the file system for persistence
            const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');
            try {
                await fs.writeFile(path.join(dataDir, key), JSON.stringify(value, null, 2), 'utf-8');
            } catch (error) {
                console.error(`FATAL: Error writing to ${key}:`, error);
            }
        },
        isInitialized: () => isInitialized,
        initialize: initializeCache
    };
})();


async function readData<T>(filename: string): Promise<T> {
    return await getInMemoryCache.get(filename);
}

async function writeData<T>(filename: string, data: T): Promise<void> {
    await getInMemoryCache.set(filename, data);
}

export const getUsers = async (): Promise<User[]> => readData<User[]>('users.json');
export const getBooks = async (): Promise<Book[]> => readData<Book[]>('books.json');
export const getHistories = async (): Promise<UserBorrowingHistory[]> => readData<UserBorrowingHistory[]>('histories.json');
export const getBookDemands = async (): Promise<BookDemand[]> => readData<BookDemand[]>('bookDemands.json');

export const saveUsers = async (data: User[]) => writeData('users.json', data);
export const saveBooks = async (data: Book[]) => writeData('books.json', data);
export const saveHistories = async (data: UserBorrowingHistory[]) => writeData('histories.json', data);
export const saveBookDemands = async (data: BookDemand[]) => writeData('bookDemands.json', data);
    