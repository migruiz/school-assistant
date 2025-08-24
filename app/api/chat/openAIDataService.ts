import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';


export async function getOpenAIKey(db: FirebaseFirestore.Firestore, schoolId: string): Promise<string> {
    const schoolDataRef = db.collection('schools').doc(schoolId);
    const docSnap = await schoolDataRef.get();
    const data = docSnap.data();
    return data?.openAIKey as string;
}



export async function getFirestoreDatabase() {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    if (getApps().length === 0) {
        initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();
    return db;
}
