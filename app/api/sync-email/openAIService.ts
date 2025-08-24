import OpenAI, { Uploadable } from "openai";
export async function importEmails(openAIKey: string, vectorStoreId: string, vectorStoreName: string, emails: any) {
    const client = new OpenAI({ apiKey: openAIKey });

    let vectorStore;
    let createdVectorStoreId = null;
    if (!vectorStoreId) {
        vectorStore = await client.vectorStores.create({   // Create vector store
            name: vectorStoreName,
        });
        createdVectorStoreId = vectorStore.id;
    }
    else{
        vectorStore = await client.vectorStores.retrieve(vectorStoreId);
    }
    const uploadable: Uploadable = new File([JSON.stringify(emails)], "inputTEST.txt", { type: "text/plain" });
    await client.vectorStores.files.uploadAndPoll(
        vectorStore.id,
        uploadable
    );
    return createdVectorStoreId;
}


