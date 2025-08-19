
'use server';

import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import usersData from './data/users.json';
import booksData from './data/books.json';
import historiesData from './data/histories.json';
import bookDemandsData from './data/bookDemands.json';

// In this version, we are treating the JSON files as a static, in-memory database.
// The data is imported directly, so it's guaranteed to be available in any environment.
// In a real-world application, this would be replaced with a proper database like Firestore, PostgreSQL, etc.

let users: User[] = usersData as User[];
let books: Book[] = booksData as Book[];
let histories: UserBorrowingHistory[] = historiesData as UserBorrowingHistory[];
let bookDemands: BookDemand[] = bookDemandsData as BookDemand[];


export const getUsers = async (): Promise<User[]> => {
  return JSON.parse(JSON.stringify(users));
};

export const getBooks = async (): Promise<Book[]> => {
  return JSON.parse(JSON.stringify(books));
};

export const getHistories = async (): Promise<UserBorrowingHistory[]> => {
    return JSON.parse(JSON.stringify(histories));
};

export const getBookDemands = async (): Promise<BookDemand[]> => {
    return JSON.parse(JSON.stringify(bookDemands));
};


export const saveUsers = async (data: User[]) => {
    users = data;
};
export const saveBooks = async (data: Book[]) => {
    books = data;
};
export const saveHistories = async (data: UserBorrowingHistory[]) => {
    histories = data;
};
export const saveBookDemands = async (data: BookDemand[]) => {
    bookDemands = data;
};
