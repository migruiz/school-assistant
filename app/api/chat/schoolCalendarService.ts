import { Firestore } from 'firebase-admin/firestore';

export async function getSchoolCalendar(db: Firestore, schoolId: string): Promise<string> {
    const schoolDataRef = db.collection('schools').doc(schoolId);
    const docSnap = await schoolDataRef.get();
    const data = docSnap.data();
    return data?.schoolCalendar as string;

}