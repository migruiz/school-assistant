import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';


export async function getSchoolInfo(
    db: FirebaseFirestore.Firestore,
    schoolId: string
): Promise<{ openAIKey: string; schoolCalendar: string; generalInfoVectorStoreId: string; childCareServicesDataVectorStoreId: string; afterSchoolDataVectorStoreId: string; policiesVectorStoreId: string }> {
    const schoolDataRef = db.collection('schools').doc(schoolId);
    const docSnap = await schoolDataRef.get();
    const data = docSnap.data();
    if (!data) {
        throw new Error(`School with ID ${schoolId} not found.`);
    }
    const { openAIKey, schoolCalendar, generalInfoVectorStoreId, childCareServicesDataVectorStoreId, afterSchoolDataVectorStoreId, policiesVectorStoreId } = data;
    return { openAIKey, schoolCalendar, generalInfoVectorStoreId, childCareServicesDataVectorStoreId, afterSchoolDataVectorStoreId, policiesVectorStoreId };
}



export async function getFirestoreDatabase() {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
    if (getApps().length === 0) {
        initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();
    return db;
}
