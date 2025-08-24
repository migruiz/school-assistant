import OpenAI, { Uploadable } from "openai";
export async function importEmails(openAIKey: string, vectorStoreId: string, vectorStoreName: string, emails: any) {
    if (emails.length === 0) {
        return null;
    }
    const client = new OpenAI({ apiKey: openAIKey });

    let vectorStore;
    let createdVectorStoreId = null;
    if (!vectorStoreId) {
        vectorStore = await client.vectorStores.create({   // Create vector store
            name: vectorStoreName,
        });
        createdVectorStoreId = vectorStore.id;
    }
    else {
        vectorStore = await client.vectorStores.retrieve(vectorStoreId);
    }


    for (const email of emails) {
        const uploadable: Uploadable = new File([JSON.stringify(email)], `${email.subject}-${email.id}.json`, { type: "application/json" });
        const uploadedFile = await client.vectorStores.files.uploadAndPoll(
            vectorStore.id,
            uploadable
        );
        console.log("Uploaded file:", JSON.stringify(uploadedFile, null, 2));
    }


    return createdVectorStoreId;
}


