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
            max_num_results: 3
        }
    );
    const filteredResults = results.data.map(item => ({
        score: item.score,
        receivedAt: item.attributes?.receivedAt,
        content: item.content
    }));
    const sortedResults = filteredResults.sort((a, b) => (b.score as number) - (a.score as number));
    const result = formatResults(sortedResults);
    return result;

}


function formatResults(data:any) {
  
  let result ="";

  data.forEach((dataItem: any, index:number) => {
    const {content, score} =  dataItem;
    result += `${index + 1}. Search Result:\n`;
    result += `Score: ${score}\n`;

    content.forEach((contentItem: any) => {
      if (contentItem.type === "text") {
        result += `${contentItem.text}"\n\n`;
      }
    });

    result += "\n\n\n\n";
  });

  return result.trim();
}