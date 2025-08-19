
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';

import initialUsersData from './data/users.json';
import initialBooksData from './data/books.json';
import initialHistoriesData from './data/histories.json';
import initialBookDemandsData from './data/bookDemands.json';

// In a serverless environment, fs operations need to target a predictable path.
// Vercel and other platforms often place the project root in /var/task/
// We will try to resolve the path dynamically.
const dataDir = path.join(process.cwd(), 'src', 'lib', 'data');

async function readData<T>(filename: string, initialData: T): Promise<T> {
  const filePath = path.join(dataDir, filename);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    // If the file doesn't exist (e.g., in a clean checkout), use initial data
    // and attempt to write it to create the file.
    if (error.code === 'ENOENT') {
      console.log(`File ${filename} not found, using initial data and creating it.`);
      await writeData(filename, initialData);
      return initialData;
    }
    console.error(`Error reading ${filename}:`, error);
    // Fallback to initial data in case of other errors
    return initialData;
  }
}

async function writeData<T>(filename: string, data: T): Promise<void> {
  const filePath = path.join(dataDir, filename);
  try {
    // Ensure the directory exists
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filename}:`, error);
    // This might fail in a read-only filesystem, but we attempt it anyway.
  }
}

export const getUsers = async (): Promise<User[]> => readData('users.json', initialUsersData as User[]);
export const getBooks = async (): Promise<Book[]> => readData('books.json', initialBooksData as Book[]);
export const getHistories = async (): Promise<UserBorrowingHistory[]> => readData('histories.json', initialHistoriesData as UserBorrowingHistory[]);
export const getBookDemands = async (): Promise<BookDemand[]> => readData('bookDemands.json', initialBookDemandsData as BookDemand[]);

export const saveUsers = async (data: User[]) => writeData('users.json', data);
export const saveBooks = async (data: Book[]) => writeData('books.json', data);
export const saveHistories = async (data: UserBorrowingHistory[]) => writeData('histories.json', data);
export const saveBookDemands = async (data: BookDemand[]) => writeData('bookDemands.json', data);
