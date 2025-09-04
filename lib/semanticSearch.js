
import OpenAI from "openai";
import { CloudClient } from "chromadb";
export async function search({collectionName, query, numberOfResults = 15}) {

    const chromaClient = new CloudClient();
    const openai = new OpenAI();

    const [collection, queryEmbedding] = await Promise.all([
        chromaClient.getCollection({ name: collectionName }),
        openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query
        })
    ]);

    const results = await collection.query({
        queryEmbeddings: [queryEmbedding.data[0].embedding],
        include: ["distances", "documents"],
        nResults: numberOfResults,
    });
    // 3. Build context from chunks
    const chunks = results.documents[0]; // documents is an array-of-arrays
    return chunks;
}