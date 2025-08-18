
'use server';

import { generatePersonalizedReminder } from '@/ai/flows/generate-personalized-reminder';
import { z } from 'zod';
import { users, books, histories } from './data';
import type { GeneratePersonalizedReminderInput } from '@/ai/flows/generate-personalized-reminder';

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
  const user = users.find((u) => u.id === userId && u.role === role && u.password === password);

  if (!user) {
    return {
      error: 'Invalid User ID, password, or role.',
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
