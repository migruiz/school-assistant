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
    const originalsCollection = await chromaClient.getOrCreateCollection({
        name: `${vectorStoreName}-originals`
    });

    for (const email of emails.reverse()) {
        const chunks = await chunkEmailUsingLangChain(email.body);
        await addOriginalToCollection(client,originalsCollection,email)
        await addChunksToCollection(chunks, client, collection, email);
    }


}

async function addOriginalToCollection(client: OpenAI, collection:any, email: any) {
    const content = formatDocument(email)
        await collection.add(
            {
                ids: [`${email.subject} - ${email.id}`],
                metadatas: [{
                    "sender": email.sender,
                    "originalSubject": email.subject,
                    "receivedAt":  email.receivedAt,
                    "receivedAtTS":  new Date(email.receivedAt).getTime(),
                }],
                documents: [content],
            }
        );
}

async function addChunksToCollection(chunks:any, client: OpenAI, collection:any, email: any) {
    for (const chunk of chunks) {
        const embeddingResponse = await client.embeddings.create({
            model: "text-embedding-3-small",
            input: chunk.pageContent
        });
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
        );
    }
}

function formatDocument(email: any) {

    let result = `**Subject**: ${email.subject}\n`;
    result += `**Date**: ${email.receivedAt}\n`;   
    result += `**Body**: \n`;
    result += `${email.body}\n`;

    return result.trim();
}
