
'use server';
/**
 * @fileOverview A Genkit flow for sending invitation emails.
 *
 * - sendInvitationEmail - A function that sends an email using nodemailer.
 * - SendInvitationEmailInput - The input type for the sendInvitationEmail function.
 * - SendInvitationEmailOutput - The return type for the sendInvitationEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';

const SendInvitationEmailInputSchema = z.object({
  to: z.string().email().describe('The email address of the recipient.'),
  subject: z.string().describe('The subject line of the email.'),
  htmlBody: z.string().describe('The HTML content of the email body.'),
  joinUrl: z.string().url().describe('The URL for the user to join.'),
});
export type SendInvitationEmailInput = z.infer<typeof SendInvitationEmailInputSchema>;

const SendInvitationEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  messageId: z.string().optional().describe('The message ID if the email was sent.'),
  error: z.string().optional().describe('Error message if sending failed.'),
});
export type SendInvitationEmailOutput = z.infer<typeof SendInvitationEmailOutputSchema>;

export async function sendInvitationEmail(input: SendInvitationEmailInput): Promise<SendInvitationEmailOutput> {
  return sendInvitationEmailFlow(input);
}

const sendInvitationEmailFlow = ai.defineFlow(
  {
    name: 'sendInvitationEmailFlow',
    inputSchema: SendInvitationEmailInputSchema,
    outputSchema: SendInvitationEmailOutputSchema,
  },
  async (input) => {
    const { to, subject, htmlBody, joinUrl } = input;

    const gmailEmail = process.env.GMAIL_EMAIL;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailEmail || !gmailAppPassword) {
      console.error('Gmail credentials (GMAIL_EMAIL, GMAIL_APP_PASSWORD) are not set in .env file.');
      return { success: false, error: 'Server configuration error: Email credentials missing.' };
    }
    
    // For development, log the join URL to console for easy access if email fails or is slow
    console.log(`[sendInvitationEmailFlow] Attempting to send invitation to ${to}. Join URL for testing: ${joinUrl}`);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailAppPassword,
      },
    });

    const mailOptions = {
      from: `"Chatterbox App" <${gmailEmail}>`,
      to: to,
      subject: subject,
      html: htmlBody,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message || 'Failed to send email.' };
    }
  }
);
