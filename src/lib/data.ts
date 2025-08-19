
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import fs from 'fs';
import path from 'path';

// Note: In a real-world application, you would use a database.
// Reading and writing to files is not suitable for production environments,
// especially serverless ones where the filesystem can be ephemeral.
// This is for demonstration purposes to make the app feel dynamic.

const dataPath = path.join(process.cwd(), 'src', 'lib', 'data');

const readData = <T>(filename: string): T[] => {
  const filePath = path.join(dataPath, filename);
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

const writeData = <T>(filename: string, data: T[]): void => {
    const filePath = path.join(dataPath, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing to ${filename}:`, error);
    }
}

export const users = () => readData<User>('users.json');
export const books = () => readData<Book>('books.json');
export const histories = () => readData<UserBorrowingHistory>('histories.json');
export const bookDemands = () => readData<BookDemand>('bookDemands.json');

export const saveUsers = (data: User[]) => writeData('users.json', data);
export const saveBooks = (data: Book[]) => writeData('books.json', data);
export const saveHistories = (data: UserBorrowingHistory[]) => writeData('histories.json', data);
export const saveBookDemands = (data: BookDemand[]) => writeData('bookDemands.json', data);
