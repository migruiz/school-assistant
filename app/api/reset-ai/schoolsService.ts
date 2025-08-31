

export async function getSchools(db: FirebaseFirestore.Firestore) {
    const schoolsRef = db.collection('schools');
    const schoolsSnap = await schoolsRef.get();
    return schoolsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            openAIKey: data.openAIKey,
        };
    });
}
