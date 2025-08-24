import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';



export async function getGmailAppCredentials(db: FirebaseFirestore.Firestore): Promise<{ clientId: string; clientSecret: string, redirectUri:string }> {
    const docGmailAppCredentialsRef = db.collection('gmailAppCredentials').doc('default');
    const docSnapGmailApp = await docGmailAppCredentialsRef.get();
    return docSnapGmailApp.data() as { clientId: string; clientSecret: string, redirectUri:string };
}

export async function updateLastHistoryId({
    db,
    emailAccountId,
    newLastHistoryId
}: {
    db: FirebaseFirestore.Firestore,
    emailAccountId: string,
    newLastHistoryId: string
}): Promise<void> {
    const monitoredEmailsRef = db.collection('monitoredEmails');
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

export async function getEmailAccountToSync(db: FirebaseFirestore.Firestore): Promise<{ email: string; gmailRefreshToken: string; lastHistoryId: string; validSenders: string; emailAccountId: string; }[]> {
    const monitoredEmailsRef = db.collection('monitoredEmails');
    const monitoredEmailsSnap = await monitoredEmailsRef.get();
    return monitoredEmailsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            emailAccountId: doc.id,
            email: data.email,
            gmailRefreshToken: data.gmailRefreshToken,
            lastHistoryId: data.lastHistoryId,
            validSenders: data.validSenders
        };
    });
}