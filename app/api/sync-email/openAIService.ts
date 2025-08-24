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


    for (const email of emails.reverse()) {
        const dataToUpload = {
            date: email.receivedAt,
            summary: email.subject,
            content: email.body,
        };
        const uploadable: Uploadable = new File([JSON.stringify(dataToUpload)], `${email.subject}-${email.id}.json`, { type: "application/json" });
        const uploadedFile = await client.vectorStores.files.uploadAndPoll(
            vectorStore.id,
            uploadable
        );

        const attributesUploaded  = await client.vectorStores.files.update(uploadedFile.id, {
            vector_store_id: vectorStore.id,
            attributes: {
                sender: email.sender,
                receivedAt: new Date(email.receivedAt).getTime(),
            },
        });

        console.log("Uploaded Data:", JSON.stringify({uploadedFile, attributesUploaded}, null, 2));
    }


    return createdVectorStoreId;
}


