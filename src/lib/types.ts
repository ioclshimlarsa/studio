
export interface Book {
  id: string;
  title: string;
  author: string;
  language: string;
  type: string; // e.g., Fiction, Non-Fiction, Novel, Poetry
  publication?: string;
  price?: number;
  status: 'Available' | 'Issued' | 'Requested';
  issuedTo?: string; // userId
  userName?: string; // user name
  issueDate?: string; // ISO string
  dueDate?: string; // ISO string
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'blocked';
  // A real app would not store passwords in this way
  password?: string;
}

export interface BorrowingHistoryEntry {
  bookId: string;
  title:string;
  issueDate: string; // ISO string
  returnDate?: string; // ISO string
  dueDate: string; // ISO string
}

export interface UserBorrowingHistory {
  userId: string;
  history: BorrowingHistoryEntry[];
}

export interface BookDemand {
    id: string;
    title: string;
    author: string;
    requestedBy: string; // userName
    date: string; // ISO string
}
