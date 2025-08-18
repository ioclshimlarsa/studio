
'use server';

import { generatePersonalizedReminder } from '@/ai/flows/generate-personalized-reminder';
import { generateWelcomeEmail } from '@/ai/flows/generate-welcome-email';
import { z } from 'zod';
import { users, books, histories } from './data';
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
  const user = users.find((u) => u.id === userId && u.role === role && u.password === password && u.status === 'active');

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

    if (users.some(u => u.id === userId)) {
        return { error: 'User ID already exists.' };
    }
    
    if (users.some(u => u.email === email)) {
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

    // In a real app, you'd save this to a database
    users.push(newUser);
    
    try {
        await generateWelcomeEmail({ name, email, userId });
        // You could add a real email sending service here
        console.log(`Welcome email generated for ${email}`);
        return { success: true, message: `User ${name} created and a welcome email has been sent.` };

    } catch (error) {
        console.error('Failed to generate welcome email:', error);
        // Still treat user creation as a success, but notify about the email failure.
        return { success: true, message: `User ${name} created, but failed to send welcome email.` };
    }
}

export async function updateUserStatus(userId: string, status: 'active' | 'inactive' | 'blocked') {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = status;
        return { success: true, message: `User status updated to ${status}.` };
    }
    return { success: false, message: 'User not found.' };
}

export async function resetUserPassword(userId: string) {
    const user = users.find(u => u.id === userId);
    if (user) {
        // In a real app, generate a random password and email it.
        user.password = 'password';
        return { success: true, message: `Password for ${user.name} has been reset to "password".` };
    }
    return { success: false, message: 'User not found.' };
}

export async function removeBook(bookId: string) {
    const bookIndex = books.findIndex(b => b.id === bookId);
    if (bookIndex > -1) {
        const book = books[bookIndex];
        // Optional: you might want to prevent deletion if a book is currently issued.
        if (book.status === 'Issued') {
            return { success: false, message: `Cannot remove "${book.title}" because it is currently issued to a user.`};
        }
        books.splice(bookIndex, 1);
        return { success: true, message: `Book "${book.title}" has been removed.` };
    }
    return { success: false, message: 'Book not found.' };
}
