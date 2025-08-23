
'use server';

/**
 * @fileOverview An AI agent for generating a welcome email for new library users.
 *
 * - generateWelcomeEmail - A function that generates a welcome email.
 * - WelcomeEmailInput - The input type for the generateWelcomeEmail function.
 * - WelcomeEmailOutput - The return type for the generateWelcomeEmail function.
 */

import {ai, initializeGenkit} from '@/ai/genkit';
import {z} from 'genkit';

const WelcomeEmailInputSchema = z.object({
  name: z.string().describe('The name of the new user.'),
  userId: z.string().describe('The user ID for the new user.'),
  email: z.string().email().describe('The email address of the new user.'),
});
export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;

const WelcomeEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The HTML body of the welcome email.'),
});
export type WelcomeEmailOutput = z.infer<typeof WelcomeEmailOutputSchema>;

export async function generateWelcomeEmail(
  input: WelcomeEmailInput
): Promise<WelcomeEmailOutput> {
  initializeGenkit();
  const prompt = ai.definePrompt({
    name: 'generateWelcomeEmailPrompt',
    input: {schema: WelcomeEmailInputSchema},
    output: {schema: WelcomeEmailOutputSchema},
    system: `You are an AI assistant for Sarb Sukh Sanjhi library. Your task is to generate a warm and informative welcome email for a new user.

  The email should:
  1. Have a welcoming subject line.
  2. Greet the user by their name.
  3. Welcome them to Sarb Sukh Sanjhi library.
  4. Provide them with their new User ID.
  5. Briefly explain that they can browse books, request them, and manage their account.
  6. End with a friendly closing.

  User Details:
  - Name: ${'{{name}}'}
  - User ID: ${'{{userId}}'}
  - Email: ${'{{email}}'}
  
  Generate the subject and an HTML body for the email.
`,
  });

  const generateWelcomeEmailFlow = ai.defineFlow(
    {
      name: 'generateWelcomeEmailFlow',
      inputSchema: WelcomeEmailInputSchema,
      outputSchema: WelcomeEmailOutputSchema,
    },
    async input => {
      const {output} = await prompt(input);
      // In a real app, you would integrate an email sending service here.
      // For now, we just log it to the console.
      console.log('--- NEW USER WELCOME EMAIL ---');
      console.log(`To: ${input.email}`);
      console.log(`Subject: ${output!.subject}`);
      console.log(`Body: \n${output!.body}`);
      console.log('-----------------------------');
      return output!;
    }
  );
  return generateWelcomeEmailFlow(input);
}
