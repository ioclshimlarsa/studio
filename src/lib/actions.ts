
'use server';

import { generatePersonalizedReminder } from '@/ai/flows/generate-personalized-reminder';
import { z } from 'zod';
import { getUsers, getBooks, getHistories, getBookDemands, saveUsers, saveBooks, saveHistories, saveBookDemands, appendBooks } from './data';
import type { GeneratePersonalizedReminderInput } from '@/ai/flows/generate-personalized-reminder';
import type { User, Book, UserBorrowingHistory, BookDemand } from './types';
import { read, utils } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { add, formatISO } from 'date-fns';

const loginSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
  role: z.enum(['user', 'admin']),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { userId, password, role } = validatedFields.data;

  const allUsers = await getUsers();
  const user = allUsers.find((u) => u.id === userId && u.role === role && u.password === password);

  if (!user) {
    return { error: 'Invalid User ID, password, or role.' };
  }
  
  if (user.status !== 'active') {
    return { error: `This account is currently ${user.status}. Please contact the administrator.`}
  }

  return {
    success: true,
    role: user.role,
    userId: user.id
  };
}

export async function getPersonalizedReminder(input: GeneratePersonalizedReminderInput) {
    try {
        const result = await generatePersonalizedReminder(input);
        return { success: true, message: result.reminderMessage };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to generate reminder.' };
    }
}


const createUserSchema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.string().email({ message: 'Invalid email address' }),
    userId: z.string().min(1, { message: 'User ID is required' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export async function createUser(prevState: any, formData: FormData) {
    const validatedFields = createUserSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            error: 'Invalid fields.',
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { name, email, userId, password } = validatedFields.data;
    const currentUsers = await getUsers();

    if (currentUsers.some(u => u.id === userId)) {
        return { error: 'User ID already exists.' };
    }
    
    if (currentUsers.some(u => u.email === email)) {
        return { error: 'Email already in use.' };
    }

    const newUser: User = {
        id: userId,
        name,
        email,
        password,
        role: userId === 'admin01' ? 'admin' : 'user', // Assign role based on userId
        status: 'active',
    };
    
    await saveUsers([...currentUsers, newUser]);
    
    return { success: true, message: `User ${name} created successfully.` };
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'blocked') {
    const currentUsers = await getUsers();
    const userIndex = currentUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        currentUsers[userIndex].status = status;
        await saveUsers(currentUsers);
        return { success: true, message: `User status updated to ${status}.` };
    }
    return { success: false, message: 'User not found.' };
}

const resetPasswordSchema = z.object({
    userId: z.string().min(1),
    newPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function resetUserPassword(prevState: any, formData: FormData) {
    const validatedFields = resetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            error: validatedFields.error.flatten().fieldErrors.newPassword?.[0] || 'Invalid input.',
        };
    }
    
    const { userId, newPassword } = validatedFields.data;
    const currentUsers = await getUsers();
    const userIndex = currentUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { error: 'User not found.' };
    }

    currentUsers[userIndex].password = newPassword;
    await saveUsers(currentUsers);

    return { success: true, message: `Password for ${currentUsers[userIndex].name} has been reset.` };
}


export async function removeBook(bookId: string) {
    let currentBooks = await getBooks();
    const bookIndex = currentBooks.findIndex(b => b.id === bookId);
    if (bookIndex > -1) {
        const book = currentBooks[bookIndex];
        if (book.status === 'Issued') {
            return { success: false, message: `Cannot remove "${book.title}" because it is currently issued to a user.`};
        }
        currentBooks = currentBooks.filter(b => b.id !== bookId);
        await saveBooks(currentBooks);
        return { success: true, message: `Book "${book.title}" has been removed.` };
    }
    return { success: false, message: 'Book not found.' };
}

const addBookSchema = z.object({
    title: z.string().min(1, { message: 'Title is required' }),
    author: z.string().min(1, { message: 'Author is required' }),
    language: z.string().min(1, { message: 'Language is required' }),
});

export async function addBook(prevState: any, formData: FormData) {
    const validatedFields = addBookSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
            error: 'Invalid fields.',
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { title, author, language } = validatedFields.data;
    
    const newBook: Book = {
        id: uuidv4(),
        title,
        author,
        language,
        status: 'Available',
    };

    await appendBooks([newBook]);

    return { success: true, message: `Book "${title}" added successfully.` };
}

export async function addBooksFromCSV(prevState: any, formData: FormData) {
    const file = formData.get('csv-file') as File;
    if (!file || file.size === 0) {
        return { error: 'No file uploaded.' };
    }

    try {
        const bytes = await file.arrayBuffer();
        const workbook = read(bytes, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = utils.sheet_to_json<{ title: string; author: string; language: string }>(worksheet);

        if (json.length === 0) {
            return { error: 'CSV file is empty or in an invalid format.' };
        }

        const newBooks: Book[] = json.map((row, index) => {
             if (!row.title || !row.author || !row.language) {
                throw new Error(`Row ${index + 2} is missing required fields (title, author, language).`);
            }
            return {
                id: uuidv4(),
                title: row.title,
                author: row.author,
                language: row.language,
                status: 'Available',
            };
        });

        await appendBooks(newBooks);

        return { success: true, message: `${newBooks.length} books added successfully from CSV.` };

    } catch (e: any) {
        console.error(e);
        return { error: `Failed to process CSV file. ${e.message}` };
    }
}

export async function approveRequest(bookId: string) {
    let currentBooks = await getBooks();
    let currentHistories = await getHistories();
    const bookIndex = currentBooks.findIndex(b => b.id === bookId);

    if (bookIndex === -1 || currentBooks[bookIndex].status !== 'Requested') {
        return { success: false, message: 'Book not found or not requested.' };
    }
    
    const book = currentBooks[bookIndex];
    const userId = book.issuedTo;
    
    if(!userId) {
        return { success: false, message: 'No user associated with this request.' };
    }

    const issueDate = new Date();
    const dueDate = add(issueDate, { days: 30 });
    book.status = 'Issued';
    book.issueDate = formatISO(issueDate);
    book.dueDate = formatISO(dueDate);
    
    let userHistory = currentHistories.find(h => h.userId === userId);
    if (!userHistory) {
        userHistory = { userId, history: [] };
        currentHistories.push(userHistory);
    }
    
    userHistory.history.push({
        bookId: book.id,
        title: book.title,
        issueDate: book.issueDate,
        dueDate: book.dueDate,
    });
    
    await saveBooks(currentBooks);
    await saveHistories(currentHistories);

    return { success: true, message: `Book "${book.title}" has been issued.` };
}


export async function rejectRequest(bookId: string) {
    let currentBooks = await getBooks();
    const bookIndex = currentBooks.findIndex(b => b.id === bookId);

    if (bookIndex === -1 || currentBooks[bookIndex].status !== 'Requested') {
        return { success: false, message: 'Book not found or not requested.' };
    }
    
    const book = currentBooks[bookIndex];
    const oldUserName = book.userName;

    book.status = 'Available';
    delete book.issuedTo;
    delete book.userName;
    delete book.issueDate;
    delete book.dueDate;
    
    await saveBooks(currentBooks);

    return { success: true, message: `Request for "${book.title}" by ${oldUserName} has been rejected.` };
}


export async function requestBook(bookId: string, userId: string, userName: string) {
    let currentBooks = await getBooks();
    const bookIndex = currentBooks.findIndex(b => b.id === bookId);

    if (bookIndex === -1 || currentBooks[bookIndex].status !== 'Available') {
        return { success: false, message: 'Book is not available for request.' };
    }

    currentBooks[bookIndex].status = 'Requested';
    currentBooks[bookIndex].issuedTo = userId;
    currentBooks[bookIndex].userName = userName;

    await saveBooks(currentBooks);

    return { success: true, message: 'Book requested successfully. Waiting for admin approval.' };
}

export async function returnBook(bookId: string, userId: string) {
    let currentBooks = await getBooks();
    let currentHistories = await getHistories();
    const bookIndex = currentBooks.findIndex(b => b.id === bookId && b.issuedTo === userId);

    if (bookIndex === -1) {
        return { success: false, message: 'Book not found or not issued to you.' };
    }

    const book = currentBooks[bookIndex];

    book.status = 'Available';
    delete book.issuedTo;
    delete book.userName;
    delete book.issueDate;
    delete book.dueDate;

    const userHistory = currentHistories.find(h => h.userId === userId);
    if (userHistory) {
        const historyEntry = userHistory.history.find(entry => entry.bookId === bookId && !entry.returnDate);
        if (historyEntry) {
            historyEntry.returnDate = formatISO(new Date());
        }
    }

    await saveBooks(currentBooks);
    await saveHistories(currentHistories);

    return { success: true, message: `Thank you for returning "${book.title}".` };
}

const demandBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
});

export async function demandBook(userName: string, formData: FormData) {
  const validatedFields = demandBookSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { error: 'Both title and author are required.' };
  }

  const { title, author } = validatedFields.data;
  const currentDemands = await getBookDemands();

  const newDemand: BookDemand = {
    id: `D${String(currentDemands.length + 1).padStart(3, '0')}_${uuidv4().slice(0,4)}`,
    title,
    author,
    requestedBy: userName,
    date: formatISO(new Date()),
  };
  
  await saveBookDemands([...currentDemands, newDemand]);

  return { success: true, message: 'Your book demand has been submitted successfully.' };
}

export async function getAdminDashboardData() {
    const users = await getUsers();
    const books = await getBooks();
    const histories = await getHistories();
    const bookDemands = await getBookDemands();
    return {
        users,
        books,
        histories,
        bookDemands
    };
}

export async function getUserDashboardData(userId: string) {
    const allBooks = await getBooks();
    const allUsers = await getUsers();
    const allHistories = await getHistories();
    const user = allUsers.find(u => u.id === userId);
    const userHistory = allHistories.find(h => h.userId === userId);
    
    if (!user) {
      console.warn(`No user found for user: ${userId}`);
    }
    
    if (!userHistory) {
      console.warn(`No history found for user: ${userId}`);
    }

    return {
        user,
        allBooks,
        myHistory: userHistory?.history ?? [],
        myBooks: allBooks.filter(book => book.issuedTo === userId),
    };
}

    