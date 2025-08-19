
'use server';

import { generatePersonalizedReminder } from '@/ai/flows/generate-personalized-reminder';
import { generateWelcomeEmail } from '@/ai/flows/generate-welcome-email';
import { z } from 'zod';
import { users, books, histories, saveUsers, saveBooks } from './data';
import type { GeneratePersonalizedReminderInput } from '@/ai/flows/generate-personalized-reminder';
import type { User } from './types';

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
    };
  }
  
  const { userId, password, role } = validatedFields.data;
  const currentUsers = users();
  const user = currentUsers.find((u) => u.id === userId && u.role === role && u.password === password && u.status === 'active');

  if (!user) {
    return {
      error: 'Invalid User ID, password, role, or user is not active.',
    };
  }

  return {
    success: true,
    role: user.role,
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
    const currentUsers = users();

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
        role: 'user',
        status: 'active',
    };
    
    currentUsers.push(newUser);
    saveUsers(currentUsers);
    
    try {
        await generateWelcomeEmail({ name, email, userId });
        console.log(`Welcome email generated for ${email}`);
        return { success: true, message: `User ${name} created and a welcome email has been sent.` };

    } catch (error) {
        console.error('Failed to generate welcome email:', error);
        return { success: true, message: `User ${name} created, but failed to send welcome email.` };
    }
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'blocked') {
    const currentUsers = users();
    const user = currentUsers.find(u => u.id === userId);
    if (user) {
        user.status = status;
        saveUsers(currentUsers);
        return { success: true, message: `User status updated to ${status}.` };
    }
    return { success: false, message: 'User not found.' };
}

export async function resetUserPassword(userId: string) {
    const currentUsers = users();
    const user = currentUsers.find(u => u.id === userId);
    if (user) {
        user.password = 'password';
        saveUsers(currentUsers);
        return { success: true, message: `Password for ${user.name} has been reset to "password".` };
    }
    return { success: false, message: 'User not found.' };
}

export async function removeBook(bookId: string) {
    const currentBooks = books();
    const bookIndex = currentBooks.findIndex(b => b.id === bookId);
    if (bookIndex > -1) {
        const book = currentBooks[bookIndex];
        if (book.status === 'Issued') {
            return { success: false, message: `Cannot remove "${book.title}" because it is currently issued to a user.`};
        }
        currentBooks.splice(bookIndex, 1);
        saveBooks(currentBooks);
        return { success: true, message: `Book "${book.title}" has been removed.` };
    }
    return { success: false, message: 'Book not found.' };
}
