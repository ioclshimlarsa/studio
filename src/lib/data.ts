
'use server';

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
    // Check if the file exists before reading
    if (!fs.existsSync(filePath)) {
        // If it doesn't exist (e.g., in a fresh deployment), return an empty array
        return [];
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // Handle case where file is empty
    if (fileContent.trim() === '') {
        return [];
    }
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

const writeData = <T>(filename: string, data: T[]): void => {
    const filePath = path.join(dataPath, filename);
    try {
        // Ensure the directory exists
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing to ${filename}:`, error);
    }
}

export const getUsers = (): User[] => readData<User>('users.json');
export const getBooks = (): Book[] => readData<Book>('books.json');
export const getHistories = (): UserBorrowingHistory[] => readData<UserBorrowingHistory>('histories.json');
export const getBookDemands = (): BookDemand[] => readData<BookDemand>('bookDemands.json');


export const saveUsers = (data: User[]) => writeData('users.json', data);
export const saveBooks = (data: Book[]) => writeData('books.json', data);
export const saveHistories = (data: UserBorrowingHistory[]) => writeData('histories.json', data);
export const saveBookDemands = (data: BookDemand[]) => writeData('bookDemands.json', data);

// Initial data seeding if files are empty
const seedData = () => {
    if (getUsers().length === 0) {
        saveUsers([
          {
            "id": "admin01",
            "name": "Admin",
            "email": "admin@library.com",
            "role": "admin",
            "password": "password",
            "status": "active"
          },
          {
            "id": "user01",
            "name": "Alice",
            "email": "alice@example.com",
            "role": "user",
            "password": "password",
            "status": "active"
          },
          {
            "id": "user02",
            "name": "Bob",
            "email": "bob@example.com",
            "role": "user",
            "password": "password",
            "status": "active"
          },
          {
            "id": "user03",
            "name": "Charlie",
            "email": "charlie@example.com",
            "role": "user",
            "password": "password",
            "status": "inactive"
          },
          {
            "id": "user04",
            "name": "Diana",
            "email": "diana@example.com",
            "role": "user",
            "password": "password",
            "status": "blocked"
          }
        ]);
    }
    if (getBooks().length === 0) {
        saveBooks([
          {
            "id": "B001",
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "language": "English",
            "status": "Issued",
            "issuedTo": "user01",
            "userName": "Alice",
            "issueDate": "2024-07-28T16:00:00.000Z",
            "dueDate": "2024-08-11T16:00:00.000Z"
          },
          {
            "id": "B002",
            "title": "To Kill a Mockingbird",
            "author": "Harper Lee",
            "language": "English",
            "status": "Issued",
            "issuedTo": "user02",
            "userName": "Bob",
            "issueDate": "2024-08-07T16:00:00.000Z",
            "dueDate": "2024-08-21T16:00:00.000Z"
          },
          {
            "id": "B003",
            "title": "1984",
            "author": "George Orwell",
            "language": "English",
            "status": "Available"
          },
          {
            "id": "B004",
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "language": "English",
            "status": "Available"
          },
          {
            "id": "B005",
            "title": "The Catcher in the Rye",
            "author": "J.D. Salinger",
            "language": "English",
            "status": "Requested",
            "issuedTo": "user01",
            "userName": "Alice"
          },
          {
            "id": "B006",
            "title": "Moby Dick",
            "author": "Herman Melville",
            "language": "English",
            "status": "Available"
          },
          {
            "id": "B007",
            "title": "War and Peace",
            "author": "Leo Tolstoy",
            "language": "English",
            "status": "Issued",
            "issuedTo": "user01",
            "userName": "Alice",
            "issueDate": "2024-08-12T16:00:00.000Z",
            "dueDate": "2024-08-26T16:00:00.000Z"
          },
          {
            "id": "B008",
            "title": "Don Quixote",
            "author": "Miguel de Cervantes",
            "language": "Spanish",
            "status": "Issued",
            "issuedTo": "user02",
            "userName": "Bob",
            "issueDate": "2024-07-16T16:00:00.000Z",
            "dueDate": "2024-08-15T16:00:00.000Z"
          }
        ]);
    }
    if (getHistories().length === 0) {
        saveHistories([
          {
            "userId": "user01",
            "history": [
              {
                "bookId": "B001",
                "title": "The Great Gatsby",
                "issueDate": "2024-06-18T16:00:00.000Z",
                "returnDate": "2024-07-03T16:00:00.000Z",
                "dueDate": "2024-07-02T16:00:00.000Z"
              },
              {
                "bookId": "B004",
                "title": "Pride and Prejudice",
                "issueDate": "2024-07-08T16:00:00.000Z",
                "returnDate": "2024-07-23T16:00:00.000Z",
                "dueDate": "2024-07-22T16:00:00.000Z"
              }
            ]
          },
          {
            "userId": "user02",
            "history": [
              {
                "bookId": "B003",
                "title": "1984",
                "issueDate": "2024-06-28T16:00:00.000Z",
                "returnDate": "2024-07-13T16:00:00.000Z",
                "dueDate": "2024-07-12T16:00:00.000Z"
              },
              {
                "bookId": "B008",
                "title": "Don Quixote",
                "issueDate": "2024-05-29T16:00:00.000Z",
                "returnDate": "2024-06-16T16:00:00.000Z",
                "dueDate": "2024-06-13T16:00:00.000Z"
              }
            ]
          }
        ]);
    }
    if (getBookDemands().length === 0) {
        saveBookDemands([
            { 
                "id": "D001", 
                "title": "The Lord of the Rings", 
                "author": "J.R.R. Tolkien", 
                "requestedBy": "Alice", 
                "date": "2024-08-15T16:00:00.000Z" 
            },
            { 
                "id": "D002", 
                "title": "The Hobbit", 
                "author": "J.R.R. Tolkien", 
                "requestedBy": "Bob", 
                "date": "2024-08-12T16:00:00.000Z" 
            }
        ]);
    }
}

// Run seeding logic once when the server starts
seedData();
