// SummarizeChannel Feature:This flow summarizes a channel's discussion so users can quickly catch up.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeChannelInputSchema = z.object({
  channelName: z.string().describe('The name of the channel to summarize.'),
  messages: z.array(z.string()).describe('The messages from the channel.'),
});
export type SummarizeChannelInput = z.infer<typeof SummarizeChannelInputSchema>;

const SummarizeChannelOutputSchema = z.object({
  summary: z.string().describe('A summary of the channel discussion.'),
});
export type SummarizeChannelOutput = z.infer<typeof SummarizeChannelOutputSchema>;

export async function summarizeChannel(input: SummarizeChannelInput): Promise<SummarizeChannelOutput> {
  return summarizeChannelFlow(input);
}

const summarizeChannelPrompt = ai.definePrompt({
  name: 'summarizeChannelPrompt',
  input: {
    schema: SummarizeChannelInputSchema,
  },
  output: {
    schema: SummarizeChannelOutputSchema,
  },
  prompt: `Summarize the following discussion from the channel "{{{channelName}}}".\n\nDiscussion:\n{{#each messages}}{{{this}}}\n{{/each}}\n\nSummary:`,
});

const summarizeChannelFlow = ai.defineFlow(
  {
    name: 'summarizeChannelFlow',
    inputSchema: SummarizeChannelInputSchema,
    outputSchema: SummarizeChannelOutputSchema,
  },
  async input => {
    const {output} = await summarizeChannelPrompt(input);
    return output!;
  }
);
