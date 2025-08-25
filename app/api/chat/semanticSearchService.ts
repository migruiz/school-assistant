import OpenAI from "openai";
export async function queryVectorStore(openAIKey: string, userQuery: any, vectorStoreId: string) {
    // Initialize OpenAI client with your API key
    const client = new OpenAI({
        apiKey: openAIKey
    });


    const results = await client.vectorStores.search(
        vectorStoreId,
        {
            query: userQuery,
            rewrite_query: true
        }
    );
    const filteredResults = results.data.map(item => ({
        score: item.score,
        receivedAt: item.attributes?.receivedAt,
        content: item.content
    }));
    const sortedResults = filteredResults.sort((a, b) => (a.receivedAt as number) - (b.receivedAt as number));
    const data = sortedResults.map(item => item.content);
    const result = formatResults(data);
    return result;

}


function formatResults(data:any) {

  let result ="";

  data.forEach((dataItem: any, index:number) => {
    result += `${index + 1}. Result:\n`;

    dataItem.forEach((contentItem: any) => {
      if (contentItem.type === "text") {
        result += `   - "${contentItem.text}"\n`;
      }
    });

    result += "\n";
  });

  return result.trim();
}