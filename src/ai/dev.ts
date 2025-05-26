
import { config } from 'dotenv';
config();

import '@/ai/genkit'; // Ensure AI object with plugins is initialized first
import '@/ai/flows/summarize-channel.ts';
import '@/ai/flows/send-invitation-email-flow.ts';
