
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

    // Enhanced credential checks
    if (!gmailEmail) {
      const errorMsg = 'GMAIL_EMAIL is not set in .env.local. Cannot send email.';
      console.error(`[sendInvitationEmailFlow] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
    if (!gmailAppPassword) {
      const errorMsg = 'GMAIL_APP_PASSWORD is not set in .env.local. Cannot send email.';
      console.error(`[sendInvitationEmailFlow] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
    if (gmailAppPassword.includes(' ') || gmailAppPassword.length !== 16) {
        const errorMsg = 'GMAIL_APP_PASSWORD appears to be invalid. It should be 16 characters long and contain NO spaces. Please regenerate it from your Google Account and update .env.local.';
        console.error(`[sendInvitationEmailFlow] ${errorMsg}`);
        console.error(`[sendInvitationEmailFlow] Current App Password (obfuscated length & spaces): Length=${gmailAppPassword.length}, HasSpaces=${gmailAppPassword.includes(' ')}`);
        return { success: false, error: errorMsg };
    }
    
    console.log(`[sendInvitationEmailFlow] Attempting to send invitation to ${to}. Join URL for testing: ${joinUrl}`);
    console.log(`[sendInvitationEmailFlow] Using Gmail Email: ${gmailEmail}, App Password: Loaded (length: ${gmailAppPassword.length})`);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail, 
        pass: gmailAppPassword,
      },
      logger: true, 
      debug: true, 
    });

    const mailOptions = {
      from: `"Opano App" <${gmailEmail}>`,
      to: to,
      subject: subject,
      html: htmlBody,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('[sendInvitationEmailFlow] Email sent successfully. Message ID: ' + info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('[sendInvitationEmailFlow] Error sending email:', error);
      console.error('[sendInvitationEmailFlow] Nodemailer error message:', error.message);
      console.error('[sendInvitationEmailFlow] Nodemailer error code:', error.code);
      console.error('[sendInvitationEmailFlow] Nodemailer full error object:', JSON.stringify(error, null, 2));
      return { success: false, error: `Failed to send email. Nodemailer: ${error.message}` };
    }
  }
);

