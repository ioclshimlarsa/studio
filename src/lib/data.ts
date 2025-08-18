
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import { subDays, addDays, formatISO } from 'date-fns';

export const users: User[] = [
  { id: 'admin01', name: 'Admin', email: 'admin@library.com', role: 'admin', password: 'password', status: 'active' },
  { id: 'user01', name: 'Alice', email: 'alice@example.com', role: 'user', password: 'password', status: 'active' },
  { id: 'user02', name: 'Bob', email: 'bob@example.com', role: 'user', password: 'password', status: 'active' },
  { id: 'user03', name: 'Charlie', email: 'charlie@example.com', role: 'user', password: 'password', status: 'inactive' },
  { id: 'user04', name: 'Diana', email: 'diana@example.com', role: 'user', password: 'password', status: 'blocked' },
];

export const books: Book[] = [
  { id: 'B001', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', language: 'English', status: 'Issued', issuedTo: 'user01', userName: 'Alice', issueDate: formatISO(subDays(new Date(), 20)), dueDate: formatISO(subDays(new Date(), 6)) },
  { id: 'B002', title: 'To Kill a Mockingbird', author: 'Harper Lee', language: 'English', status: 'Issued', issuedTo: 'user02', userName: 'Bob', issueDate: formatISO(subDays(new Date(), 10)), dueDate: formatISO(addDays(new Date(), 4)) },
  { id: 'B003', title: '1984', author: 'George Orwell', language: 'English', status: 'Available' },
  { id: 'B004', title: 'Pride and Prejudice', author: 'Jane Austen', language: 'English', status: 'Available' },
  { id: 'B005', title: 'The Catcher in the Rye', author: 'J.D. Salinger', language: 'English', status: 'Requested', issuedTo: 'user01', userName: 'Alice' },
  { id: 'B006', title: 'Moby Dick', author: 'Herman Melville', language: 'English', status: 'Available' },
  { id: 'B007', title: 'War and Peace', author: 'Leo Tolstoy', language: 'English', status: 'Issued', issuedTo: 'user01', userName: 'Alice', issueDate: formatISO(subDays(new Date(), 5)), dueDate: formatISO(addDays(new Date(), 9)) },
  { id: 'B008', title: 'Don Quixote', author: 'Miguel de Cervantes', language: 'Spanish', status: 'Issued', issuedTo: 'user02', userName: 'Bob', issueDate: formatISO(subDays(new Date(), 32)), dueDate: formatISO(subDays(new Date(), 2)) },
];

export const histories: UserBorrowingHistory[] = [
  {
    userId: 'user01',
    history: [
      { bookId: 'B001', title: 'The Great Gatsby', issueDate: formatISO(subDays(new Date(), 60)), returnDate: formatISO(subDays(new Date(), 45)), dueDate: formatISO(subDays(new Date(), 46)) },
      { bookId: 'B004', title: 'Pride and Prejudice', issueDate: formatISO(subDays(new Date(), 40)), returnDate: formatISO(subDays(new Date(), 25)), dueDate: formatISO(subDays(new Date(), 26)) },
    ],
  },
  {
    userId: 'user02',
    history: [
      { bookId: 'B003', title: '1984', issueDate: formatISO(subDays(new Date(), 50)), returnDate: formatISO(subDays(new Date(), 35)), dueDate: formatISO(subDays(new Date(), 36)) },
      { bookId: 'B008', title: 'Don Quixote', issueDate: formatISO(subDays(new Date(), 80)), returnDate: formatISO(subDays(new Date(), 62)), dueDate: formatISO(subDays(new Date(), 65)) }, // Returned late
    ],
  },
];

export const bookDemands: BookDemand[] = [
    { id: 'D001', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', requestedBy: 'Alice', date: formatISO(subDays(new Date(), 2)) },
    { id: 'D002', title: 'The Hobbit', author: 'J.R.R. Tolkien', requestedBy: 'Bob', date: formatISO(subDays(new Date(), 5)) },
];
