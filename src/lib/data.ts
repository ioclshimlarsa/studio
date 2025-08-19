
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';

// Dynamically determine the project root.
// In a serverless environment, this might be different from the local environment.
const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'src', 'lib', 'data');

async function readData<T>(filename: string, initialData: T): Promise<T> {
  const filePath = path.join(dataDir, filename);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    // If the file doesn't exist, it means we are in a fresh environment.
    // Use the initial data that was imported from the JSON file.
    if (error.code === 'ENOENT') {
      console.log(`File ${filename} not found, using initial data. A new file will be created on first write.`);
      // We don't write here, we let the first `save` operation create the file.
      return initialData;
    }
    console.error(`Error reading ${filename}:`, error);
    // Fallback to initial data for other errors.
    return initialData;
  }
}

async function writeData<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(dataDir, filename);
  try {
    // Ensure the directory exists before writing.
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Successfully wrote to ${filePath}`);
  } catch (error) {
    console.error(`FATAL: Error writing to ${filename}:`, error);
    // In a serverless environment, if this fails, data will not be persistent.
    // This is a critical error to log.
  }
}

// Load initial data once at startup. This will be the baseline.
let initialUsersData: User[] = [];
let initialBooksData: Book[] = [];
let initialHistoriesData: UserBorrowingHistory[] = [];
let initialBookDemandsData: BookDemand[] = [];

// Use a self-invoking async function to load initial data from files.
(async () => {
    try {
        initialUsersData = JSON.parse(await fs.readFile(path.join(dataDir, 'users.json'), 'utf-8'));
        initialBooksData = JSON.parse(await fs.readFile(path.join(dataDir, 'books.json'), 'utf-8'));
        initialHistoriesData = JSON.parse(await fs.readFile(path.join(dataDir, 'histories.json'), 'utf-8'));
        initialBookDemandsData = JSON.parse(await fs.readFile(path.join(dataDir, 'bookDemands.json'), 'utf-8'));
    } catch (e) {
        console.warn("Could not read initial data files, will use empty arrays. This is expected on first run.", e);
    }
})();


export const getUsers = async (): Promise<User[]> => readData('users.json', initialUsersData);
export const getBooks = async (): Promise<Book[]> => readData('books.json', initialBooksData);
export const getHistories = async (): Promise<UserBorrowingHistory[]> => readData('histories.json', initialHistoriesData);
export const getBookDemands = async (): Promise<BookDemand[]> => readData('bookDemands.json', initialBookDemandsData);

export const saveUsers = async (data: User[]) => writeData('users.json', data);
export const saveBooks = async (data: Book[]) => writeData('books.json', data);
export const saveHistories = async (data: UserBorrowingHistory[]) => writeData('histories.json', data);
export const saveBookDemands = async (data: BookDemand[]) => writeData('bookDemands.json', data);

    