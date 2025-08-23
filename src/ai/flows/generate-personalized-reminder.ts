
'use server';

/**
 * @fileOverview An AI agent for generating personalized reminder messages for overdue books.
 *
 * - generatePersonalizedReminder - A function that generates personalized reminder messages.
 * - GeneratePersonalizedReminderInput - The input type for the generatePersonalizedReminder function.
 * - GeneratePersonalizedReminderOutput - The return type for the generatePersonalizedReminder function.
 */

import {ai, initializeGenkit} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedReminderInputSchema = z.object({
  userId: z.string().describe('The ID of the user receiving the reminder.'),
  bookTitle: z.string().describe('The title of the overdue book.'),
  dueDate: z.string().describe('The due date of the book (YYYY-MM-DD).'),
  borrowingHistory: z
    .string()
    .describe(
      'A summary of the user borrowing history, including titles, due dates, and return dates of previous books.'
    ),
});
export type GeneratePersonalizedReminderInput = z.infer<
  typeof GeneratePersonalizedReminderInputSchema
>;

const GeneratePersonalizedReminderOutputSchema = z.object({
  reminderMessage: z
    .string()
    .describe('The personalized reminder message for the user.'),
});
export type GeneratePersonalizedReminderOutput = z.infer<
  typeof GeneratePersonalizedReminderOutputSchema
>;

export async function generatePersonalizedReminder(
  input: GeneratePersonalizedReminderInput
): Promise<GeneratePersonalizedReminderOutput> {
  initializeGenkit();
  const prompt = ai.definePrompt({
    name: 'generatePersonalizedReminderPrompt',
    input: {schema: GeneratePersonalizedReminderInputSchema},
    output: {schema: GeneratePersonalizedReminderOutputSchema},
    system: `You are an AI assistant tasked with generating personalized reminder messages for users with overdue books.

  The goal is to generate a gentle and effective reminder message that encourages the user to return the book promptly.
  Leverage the user's past borrowing history to tailor the tone and format of the message.
  Consider their past behavior (e.g., whether they typically return books on time, any late returns, preferred genres) to create a personalized message.
  If the user has a history of on-time returns, use a friendly and appreciative tone.
  If the user has a history of late returns, use a slightly more firm but still polite tone.

  User ID: ${'{{userId}}'}
  Book Title: ${'{{bookTitle}}'}
  Due Date: ${'{{dueDate}}'}
  Borrowing History: ${'{{borrowingHistory}}'}

  Compose a personalized reminder message that considers the above information.  The message should be brief (under 50 words).
  Start by greeting the user by their user ID.
  Then remind them of the book that is overdue and when it was due.
  Then encourage them to return the book as soon as possible.
  Finally, thank them for using our library and include a friendly closing.
`,
  });

  const generatePersonalizedReminderFlow = ai.defineFlow(
    {
      name: 'generatePersonalizedReminderFlow',
      inputSchema: GeneratePersonalizedReminderInputSchema,
      outputSchema: GeneratePersonalizedReminderOutputSchema,
    },
    async input => {
      const {output} = await prompt(input);
      return output!;
    }
  );
  return generatePersonalizedReminderFlow(input);
}
