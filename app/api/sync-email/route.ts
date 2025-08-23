import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';





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



export async function POST(req: NextRequest) {
  // Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
  try {
    const docGmailAppCredentialsRef = db.collection('gmailAppCredentials').doc('default');
    const docSnapGmailApp = await docGmailAppCredentialsRef.get();
    if (!docSnapGmailApp.exists) {
      return NextResponse.json({ success: false, error: 'Gmail credentials not found in Firestore.' }, { status: 500 });
    }
    const gmailAppCreds = docSnapGmailApp.data();
    if (!gmailAppCreds) {
      return NextResponse.json({ success: false, error: 'Gmail credentials data is undefined in Firestore.' }, { status: 500 });
    }
    const CLIENT_ID = gmailAppCreds.clientId;
    const CLIENT_SECRET = gmailAppCreds.clientSecret;
    const REDIRECT_URI = gmailAppCreds.redirectUri;


    const monitoredEmailsRef = db.collection('monitoredEmails');
    const monitoredEmailsSnap = await monitoredEmailsRef.get();
    const emailDetails = [];
    for (const doc of monitoredEmailsSnap.docs) {
      const { email, gmailRefreshToken, validSenders, lastHistoryId } = doc.data();
      console.log(`Monitored Email: ${email}, Refresh Token: ${gmailRefreshToken}, Valid Senders: ${validSenders}, Last HistoryId: ${lastHistoryId}`);

      const REFRESH_TOKEN = gmailRefreshToken;
      const oAuth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
      );
      oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

      // Connect to Gmail API
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

      let newLastHistoryId = lastHistoryId;
      let newMessages: any[] = [];

      try {
        if (lastHistoryId) {
          // Use history.list to get changes since lastHistoryId
          const historyRes = await gmail.users.history.list({
            userId: 'me',
            startHistoryId: lastHistoryId,
            historyTypes: ['messageAdded'],
            labelId: 'INBOX',
            maxResults: 20,
          });
          const history = historyRes.data.history || [];
          // Collect new message IDs
          const messageIds = new Set<string>();
          for (const h of history) {
            if (h.messagesAdded) {
              for (const m of h.messagesAdded) {
                if (m.message && m.message.id) {
                  messageIds.add(m.message.id);
                }
              }
            }
          }
          // Fetch new messages
          for (const id of messageIds) {
            const msgRes = await gmail.users.messages.get({ userId: 'me', id });
            const payload = msgRes.data.payload;
            const subject = getHeader(payload?.headers, 'Subject') || '';
            const body = getBody(payload);
            const receivedAt = getDate(payload?.headers) || '';
            const sender = getSender(payload?.headers) || '';
            newMessages.push({
              id,
              subject,
              body,
              receivedAt,
              sender,
            });
          }
          // Update lastHistoryId if present
          if (historyRes.data.historyId) {
            newLastHistoryId = historyRes.data.historyId;
          }
        } else {
          // First sync: fetch last 3 messages and get their historyId
          const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 3,
            labelIds: ['INBOX'],
            q: '',
          });
          const messages = res.data.messages || [];
          for (const msg of messages) {
            const msgRes = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
            const payload = msgRes.data.payload;
            const subject = getHeader(payload?.headers, 'Subject') || '';
            const body = getBody(payload);
            const receivedAt = getDate(payload?.headers) || '';
            const sender = getSender(payload?.headers) || '';
            newMessages.push({
              id: msg.id,
              subject,
              body,
              receivedAt,
              sender,
            });
          }
          // Get the latest historyId from the most recent message
          if (messages.length > 0) {
            const latestMsg = await gmail.users.messages.get({ userId: 'me', id: messages[0].id! });
            if (latestMsg.data.historyId) {
              newLastHistoryId = latestMsg.data.historyId;
            }
          }
        }
      } catch (err) {
        console.error('Error during Gmail sync:', err);
      }

      // Add new messages to emailDetails
      for (const m of newMessages) {
        emailDetails.push(m);
      }

      // Update lastHistoryId in Firestore if changed
      if (newLastHistoryId && newLastHistoryId !== lastHistoryId) {
        await doc.ref.update({ lastHistoryId: newLastHistoryId });
      }
    }


    return NextResponse.json({ success: true, emails: emailDetails });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
