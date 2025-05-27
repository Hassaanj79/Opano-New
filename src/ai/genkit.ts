
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Load the API key from environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  const errorMessage = 
    'GEMINI_API_KEY is not set in the environment. ' +
    'Please get your API key from Google AI Studio (https://aistudio.google.com/app/apikey) ' +
    'and set it in your .env file (e.g., .env.local if using Next.js for server-side Genkit calls, or .env for the Genkit dev server).';
  console.error(`\n${"=".repeat(errorMessage.length)}\n${errorMessage}\n${"=".repeat(errorMessage.length)}\n`);
  // Depending on the execution context, you might want to throw an error here
  // to prevent Genkit from trying to initialize without a key,
  // or allow it to proceed if some flows don't require Google AI.
  // For now, we'll let it proceed but it will likely fail when a Gemini model is called.
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: geminiApiKey }), // Explicitly pass the API key
  ],
  model: 'googleai/gemini-2.0-flash', // Default model
});

