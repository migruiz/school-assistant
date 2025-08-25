import OpenAI from "openai";
export async function queryGeneralInfoVectorStore(openAIKey: string, userQuery: any, generalInfoVectorStoreId: string) {
    const client = new OpenAI({
        apiKey: openAIKey
    });


    const results = await client.vectorStores.search(
        generalInfoVectorStoreId,
        {
            query: userQuery,
            rewrite_query: true
        }
    );
    const data = results.data.map(item => item.content);
    return data;

}


