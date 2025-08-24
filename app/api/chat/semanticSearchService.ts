import OpenAI from "openai";
export async function queryVectorStore(openAIKey: string, userQuery: any, vectorStoreId: string) {
    // Initialize OpenAI client with your API key
    const openai = new OpenAI({
        apiKey: openAIKey
    });
    const client = new OpenAI();


    const results = await client.vectorStores.search(
        vectorStoreId,
        {
            query: userQuery,
            rewrite_query: true
        }
    );
    return results

}