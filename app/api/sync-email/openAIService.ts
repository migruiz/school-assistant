import OpenAI, { Uploadable } from "openai";
export async function importEmails(openAIKey: string, vectorStoreId: string, vectorStoreName: string, email: any) {
    const client = new OpenAI({ apiKey: openAIKey });

    let vectorStore;
    if (!vectorStoreId) {
        vectorStore = await client.vectorStores.create({   // Create vector store
            name: vectorStoreName,
        });
    }
    else{
        vectorStore = await client.vectorStores.retrieve(vectorStoreId);
    }
    const uploadable: Uploadable = new File([JSON.stringify(email)], "inputTEST.txt", { type: "text/plain" });
    await client.vectorStores.files.uploadAndPoll(
        vectorStore.id,
        uploadable
    );
}
