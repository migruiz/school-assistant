import OpenAI, { Uploadable } from "openai";
import { summarizeForSemanticSearch } from './summarizerService'
import { CloudClient } from "chromadb";
export async function importEmails(openAIKey: string, vectorStoreName: string, emails: any) {
    if (emails.length === 0) {
        return null;
    }
    const client = new OpenAI({ apiKey: openAIKey });
    const chromaClient = new CloudClient();

    const collection = await chromaClient.getOrCreateCollection({
        name: vectorStoreName,
        metadata: { "hnsw:space": "cosine" }
    });

    for (const email of emails.reverse()) {
        const summaryData = await summarizeForSemanticSearch(openAIKey, {
            subject: email.subject,
            body: email.body
        });
        const dataToUpload = {
            date: email.receivedAt,
            subject: summaryData.newSubject,
            eventUpdates: summaryData.eventUpdates,
            topics: summaryData.topics.join(", "),
            body: email.body,
            likelyQuestions: summaryData.likelyQuestions

        };
        const documentForSemanticSearch = formatDocumentForSemanticSearch(dataToUpload);
        const embeddingResponse = await client.embeddings.create({
            model: "text-embedding-3-small",
            input: documentForSemanticSearch
        })
        const embedding = embeddingResponse.data[0].embedding;
        await collection.add(
            {
                ids: [email.id],
                embeddings: [embedding],
                metadatas: [{ "sender": email.sender, "originalSubject": email.subject, "receivedAt": email.receivedAt }],
                documents: [documentForSemanticSearch],
            }
        )


        console.log("Uploaded Data:", JSON.stringify(documentForSemanticSearch, null, 2));
    }


}

function formatDocumentForSemanticSearch(dataToUpload: any) {

    let result = `**Subject**: ${dataToUpload.subject}\n`;
    result += `**Date**: ${dataToUpload.date}\n`;
    result += `**Topics**: ${dataToUpload.topics}\n`;
    result += `**Body**: \n`;
    result += `${dataToUpload.body}\n`;
    result += `**Likely Questions**: \n`;
    result += `${dataToUpload.likelyQuestions.join("\n")}\n`;

    return result.trim();
}
