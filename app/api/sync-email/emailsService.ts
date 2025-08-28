import { gmail_v1 } from "googleapis";

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


export async function getAddedEmails(gmail: gmail_v1.Gmail, newLastHistoryId: string) {
    // Use history.list to get changes since lastHistoryId
    const historyRes = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: newLastHistoryId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
        maxResults: 20,
    });
    const history = historyRes.data.history || [];
    // Collect new message IDs
    let emails: any[] = [];
    for (const h of history) {
        if (h.messagesAdded) {
            for (const m of h.messagesAdded) {
                if (m.message && m.message.id) {
                    const email = await getEmailDetails(gmail, m.message.id);
                    emails.push(email);
                }
            }
        }
    }
    return { emails, lastHistoryId: historyRes.data.historyId as any };
}



export async function getLast3Emails(gmail: gmail_v1.Gmail) {
    let emails: any[] = [];
    const res = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 30,
        labelIds: ['INBOX'],
        q: '',
    });
    const messages = res.data.messages || [];
    for (const msg of messages) {
        const emailDetails = await getEmailDetails(gmail, msg.id!);
        emails.push(emailDetails);
    }
    return {emails, lastHistoryId: emails.length > 0 ? emails[0].historyId : null };

}




async function getEmailDetails(gmail: gmail_v1.Gmail, messageId: string) {
    const msgRes = await gmail.users.messages.get({ userId: 'me', id: messageId });
    const payload = msgRes.data.payload;
    const originalSubject = getHeader(payload?.headers, 'Subject') || '';
    const subject = extractSubject(originalSubject);
    const body = getBody(payload);
    const receivedAt = extractReceivedAt(originalSubject, payload);
    const sender = getSender(payload?.headers) || '';
    const historyId = msgRes.data.historyId
    return {
        id: messageId,
        subject,
        body,
        receivedAt,
        sender,
        historyId
    };
}

function extractSubject(subject:string){
    if (subject.includes("***")) {
        return subject.split("***")[0].trim();
    }
    else{
        return subject
    }
}

function extractReceivedAt(subject:string, payload:any){
    if (subject.includes("***")) {
        const dateStr = subject.split("***")[1].trim();
        const date = new Date(dateStr);
        return date.toISOString();
    }
    else{
        return getDate(payload?.headers) || '';
    }
}