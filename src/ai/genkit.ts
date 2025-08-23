
import {genkit, Genkit as GenkitCore} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export let ai: GenkitCore;

export function initializeGenkit() {
  if (ai) {
    return;
  }
  ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.0-flash',
  });
}
