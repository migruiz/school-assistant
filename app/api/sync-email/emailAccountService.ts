import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { gmail_v1, google } from 'googleapis';


export async function getGmailAppCredentials(db: FirebaseFirestore.Firestore): Promise<{ clientId: string; clientSecret: string, redirectUri:string }> {
    const docGmailAppCredentialsRef = db.collection('gmailAppCredentials').doc('default');
    const docSnapGmailApp = await docGmailAppCredentialsRef.get();
    return docSnapGmailApp.data() as { clientId: string; clientSecret: string, redirectUri:string };
}

export async function updateLastHistoryId({
    db,
    schoolId,
    emailAccountId,
    newLastHistoryId
}: {
    db: FirebaseFirestore.Firestore,
    schoolId: string,
    emailAccountId: string,
    newLastHistoryId: string
}): Promise<void> {
    const monitoredEmailsRef = db.collection('schools').doc(schoolId).collection('monitoredEmails');
    const emailDocRef = monitoredEmailsRef.doc(emailAccountId);
    await emailDocRef.update({ lastHistoryId: newLastHistoryId });
}



export async function getFirestoreDatabase() {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    if (getApps().length === 0) {
        initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();
    return db;
}

export  function getGmailApiClient(gmailAppCredentials: { clientId: string; clientSecret: string, redirectUri:string }, gmailRefreshToken: string) : gmail_v1.Gmail {
    const oAuth2Client = new google.auth.OAuth2(
        gmailAppCredentials.clientId,
        gmailAppCredentials.clientSecret,
        gmailAppCredentials.redirectUri
      );
      oAuth2Client.setCredentials({ refresh_token: gmailRefreshToken });

      // Connect to Gmail API
      const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
      return gmail;
}


export async function getEmailsAccountToSync(db: FirebaseFirestore.Firestore, schoolId: string): Promise<{ email: string; gmailRefreshToken: string; lastHistoryId: string; validSenders: string; emailAccountId: string; vectorStoreId: string; purpose: string }[]> {
    const monitoredEmailsRef = db.collection('schools').doc(schoolId).collection('monitoredEmails');
    const monitoredEmailsSnap = await monitoredEmailsRef.get();
    return monitoredEmailsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            emailAccountId: doc.id,
            email: data.email,
            gmailRefreshToken: data.gmailRefreshToken,
            lastHistoryId: data.lastHistoryId,
            validSenders: data.validSenders,
            vectorStoreId: data.vectorStoreId,
            purpose: data.purpose
        };
    });
}