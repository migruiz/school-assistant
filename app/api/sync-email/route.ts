import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// TODO: Replace with your actual credentials and token logic
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || '';
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';

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
      maxResults: 5,
      labelIds: ['INBOX'],
      q: '',
    });

    const messages = res.data.messages || [];
    const emailDetails = [];

    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
      emailDetails.push({
        id: msg.id,
        snippet: msgRes.data.snippet,
        payload: msgRes.data.payload,
      });
    }

    return NextResponse.json({ success: true, emails: emailDetails });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
