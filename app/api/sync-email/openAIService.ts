import OpenAI, { Uploadable } from "openai";
import { summarizeForSemanticSearch } from './summarizerService'
import { chunkEmail } from "./chunkingService";
import { chunkEmailUsingLangChain } from "./chunkingLangChain";
import { CloudClient } from "chromadb";
export async function importEmails(openAIKey: string, vectorStoreName: string, emails: any) {
    if (emails.length === 0) {
        return null;
    }
    const client = new OpenAI({ apiKey: openAIKey });
    const chromaClient = new CloudClient();

    const collection = await chromaClient.getOrCreateCollection({
        name: `${vectorStoreName}-chunks-langChain`,
        metadata: { "hnsw:space": "cosine" }
    });

    for (const email of emails.reverse()) {
        const chunks = await chunkEmailUsingLangChain(email.body);
        for (const chunk of chunks) {
            const embeddingResponse = await client.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk.pageContent
            })
            const embedding = embeddingResponse.data[0].embedding;
            await collection.add(
                {
                    ids: [`${email.subject} - ${email.id} - ${chunks.indexOf(chunk)}`],
                    embeddings: [embedding],
                    metadatas: [{
                        "sender": email.sender,
                        "originalSubject": email.subject,
                        "receivedAt": email.receivedAt,
                        chunkData: JSON.stringify(chunk.metadata)
                    }],
                    documents: [chunk.pageContent],
                }
            )
        }




    }


}

function formatDocumentForSemanticSearch(dataToUpload: any) {

    let result = `**Subject**: ${dataToUpload.subject}\n`;
    result += `**Topics**: ${dataToUpload.topics}\n`;
    result += `**Body**: \n`;
    result += `${dataToUpload.body}\n`;

    return result.trim();
}
