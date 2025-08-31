import OpenAI from "openai";
import {rerank} from './reRanker'
export async function queryVectorStore(openAIKey: string, userQuery: any, vectorStoreId: string) {
    // Initialize OpenAI client with your API key
    const client = new OpenAI({
        apiKey: openAIKey
    });


    const vectorSeaechResults = await client.vectorStores.search(
        vectorStoreId,
        {
            query: userQuery,
            max_num_results: 5
        }
    );
    const results = vectorSeaechResults.data.map(item => ({
        similarityScore: item.score,
        receivedAt: item.attributes?.receivedAt,
        content: getFullContentAsText(item.content as [])
    }));
    const rankedResults = await rerank({openAIKey, query: userQuery, emails: results});
    const resultsToLLM = rankedResults.map((item: any) => item.content);
    return resultsToLLM;

}


function formatResults(data:any) {
  
  let result ="";

  data.forEach((dataItem: any, index:number) => {
    const {content} =  dataItem;
    result += `${index + 1}. Search Result:\n`;

    content.forEach((contentItem: any) => {
      if (contentItem.type === "text") {
        result += `${contentItem.text}"\n\n`;
      }
    });

    result += "\n\n\n\n";
  });

  return result.trim();
}



function getFullContentAsText(content:[]) {

  let result ="";
    content.forEach((contentItem: any) => {
      if (contentItem.type === "text") {
        result += `${contentItem.text}"\n`;
      }
    });
    return result;
}