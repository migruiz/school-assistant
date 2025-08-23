import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// TODO: Replace with your actual credentials and token logic
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || '';
const REFRESH_TOKEN = process.env.RETNS_GMAIL_REFRESH_TOKEN || '';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export async function POST(req: NextRequest) {
  try {
    // Connect to Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Fetch the last 5 emails from the inbox
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 3,
      labelIds: ['INBOX'],
      q: '',
    });

    const messages = res.data.messages || [];
    const emailDetails = [];


    function getHeader(headers: any[] | undefined, name: string): string | undefined {
      if (!headers) return undefined;
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header?.value;
    }

    function getDate(headers: any[] | undefined): string | undefined {
      const dateStr = getHeader(headers, 'Date');
      if (!dateStr) return undefined;
      // Convert to ISO string if possible
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? dateStr : date.toISOString();
    }

    function getBody(payload: any): string {
      if (!payload) return '';
      // If the email is plain text
      if (payload.body && payload.body.data && payload.mimeType === 'text/plain') {
        return Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }
      // If the email is multipart, search recursively for text/plain, then fallback to text/html
      let htmlBody = '';
      if (payload.parts && Array.isArray(payload.parts)) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          if (part.mimeType === 'text/html' && part.body && part.body.data && !htmlBody) {
            htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          // Recursively check nested parts
          if (part.parts && Array.isArray(part.parts)) {
            const nested = getBody(part);
            if (nested) return nested;
          }
        }
      }
      // Fallback to HTML body if no plain text found
      if (htmlBody) return htmlBody;
      return '';
    }

    function getSender(headers: any[] | undefined): string | undefined {
      const from = getHeader(headers, 'From');
      if (!from) return undefined;
      // Extract email address from the From header
      const match = from.match(/<(.+?)>/);
      return match ? match[1] : from;
    }

    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
      const payload = msgRes.data.payload;
      const subject = getHeader(payload?.headers, 'Subject') || '';
      const body = getBody(payload);
      const receivedAt = getDate(payload?.headers) || '';
      const sender = getSender(payload?.headers) || '';
      emailDetails.push({
        id: msg.id,
        subject,
        body,
        receivedAt,
        sender,
      });
    }

    return NextResponse.json({ success: true, emails: emailDetails });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
