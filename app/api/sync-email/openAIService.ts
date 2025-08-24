import OpenAI, { Uploadable } from "openai";
export async function importEmails(email: any) {
    return
    const client = new OpenAI();

    const vector_store = await client.vectorStores.create({   // Create vector store
        name: "Support FAQ",
    });
    const uploadable: Uploadable = new File([JSON.stringify(email)], "inputTEST.txt", { type: "text/plain" });
    await client.vectorStores.files.uploadAndPoll(
        vector_store.id,
        uploadable
    );
}
