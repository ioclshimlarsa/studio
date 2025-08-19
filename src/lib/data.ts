
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';

// Import the initial data directly. This is more reliable in serverless environments.
import initialUsers from './data/users.json';
import initialBooks from './data/books.json';
import initialHistories from './data/histories.json';
import initialBookDemands from './data/bookDemands.json';

// In-memory cache singleton
const getInMemoryCache = (() => {
    let cache: {
        'users.json': User[];
        'books.json': Book[];
        'histories.json': UserBorrowingHistory[];
        'bookDemands.json': BookDemand[];
    } = {
        'users.json': [],
        'books.json': [],
        'histories.json': [],
        'bookDemands.json': [],
    };
    let isInitialized = false;

    const initializeCache = () => {
        if (isInitialized) return;

        // Use the imported JSON data as the initial state of the cache.
        // The `JSON.parse(JSON.stringify(...))` is a deep copy to prevent mutating the original imported object.
        cache['users.json'] = JSON.parse(JSON.stringify(initialUsers));
        cache['books.json'] = JSON.parse(JSON.stringify(initialBooks));
        cache['histories.json'] = JSON.parse(JSON.stringify(initialHistories));
        cache['bookDemands.json'] = JSON.parse(JSON.stringify(initialBookDemands));
        
        isInitialized = true;
    };

    return {
        get: <T>(key: keyof typeof cache): T => {
            if (!isInitialized) initializeCache();
            // Return a deep copy to prevent accidental mutation of the cache from outside
            return JSON.parse(JSON.stringify(cache[key]));
        },
        set: async (key: keyof typeof cache, value: any) => {
            if (!isInitialized) initializeCache();
            
            // Update the in-memory cache
            cache[key] = value;

            // Also write it back to the file system for persistence across server restarts.
            const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');
            try {
                // Ensure the directory exists
                await fs.mkdir(dataDir, { recursive: true });
                // Write the file
                await fs.writeFile(path.join(dataDir, key), JSON.stringify(value, null, 2), 'utf-8');
            } catch (error) {
                console.error(`FATAL: Error writing to ${key}:`, error);
                // Even if file write fails, the app continues to work with in-memory data for the current session.
            }
        },
    };
})();

// Public data access functions
export const getUsers = async (): Promise<User[]> => getInMemoryCache.get('users.json');
export const getBooks = async (): Promise<Book[]> => getInMemoryCache.get('books.json');
export const getHistories = async (): Promise<UserBorrowingHistory[]> => getInMemoryCache.get('histories.json');
export const getBookDemands = async (): Promise<BookDemand[]> => getInMemoryCache.get('bookDemands.json');

// Public data saving functions
export const saveUsers = async (data: User[]) => getInMemoryCache.set('users.json', data);
export const saveBooks = async (data: Book[]) => getInMemoryCache.set('books.json', data);
export const saveHistories = async (data: UserBorrowingHistory[]) => getInMemoryCache.set('histories.json', data);
export const saveBookDemands = async (data: BookDemand[]) => getInMemoryCache.set('bookDemands.json', data);
    