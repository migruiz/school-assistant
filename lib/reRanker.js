import OpenAI from "openai";

export const reRank = async ({ openAIKey, query, semanticSearchResults, topK = 3 }) => {
    if (semanticSearchResults.length <= topK) {
        return semanticSearchResults;
    }
    const openai = new OpenAI({
        apiKey: openAIKey
    });
    const prompt = getPrompt(query, semanticSearchResults);


    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant that ranks the semantic search results based on their relevance to the user query." },
            { role: "user", content: prompt }
        ],
        temperature: 0
    });




    const rankingText = response.choices[0].message.content.trim();
    const ranking = JSON.parse(rankingText);

    const reordered = [];
    for (const rank of ranking.slice(0, topK)) { // Only take topK
        if (rank >= 1 && rank <= semanticSearchResults.length) {
            reordered.push(semanticSearchResults[rank - 1]);
        }
    }

    return reordered;


}


const getPrompt = (query, semanticSearchResults) => {


    const prompt = `
Query: "${query}"

The Semantic Search results to rank in JSON array format:
${JSON.stringify(semanticSearchResults)}

- Rank these Semantic Search results from most relevant (1) to least relevant (${semanticSearchResults.length}) for answering the user query.

Consider:
- Which search result best answers the specific question?
- Specific information is better than general information

Respond with only the ranking as a JSON array: [item_number, item_number, ...]
Example: [3, 1, 5] means item 3 is most relevant, then item 1, then item 5.`;
    return prompt;
}