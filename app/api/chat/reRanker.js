import OpenAI from "openai";

export const rerank = async ({openAIKey, query, emails, topK = 3}) => {
    if (emails.length <= topK) {
        return emails;
    }
    const openai = new OpenAI({
        apiKey: openAIKey
    });
    const prompt = getPrompt(query, emails);
    console.log("Reranking prompt:", prompt);

    try {



        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant that ranks emails based on their relevance to a query." },
                { role: "user", content: prompt }
            ],
            temperature: 0
        });




        const rankingText = response.choices[0].message.content.trim();
        const ranking = JSON.parse(rankingText);

        // Reorder emails based on ranking
        const reordered = [];
        for (const rank of ranking.slice(0, topK)) { // Only take topK
            if (rank >= 1 && rank <= emails.length) {
                reordered.push(emails[rank - 1]);
            }
        }

        return reordered;

    } catch (error) {
        console.error(`Reranking failed: ${error.message}, using original order`);
        return emails.slice(0, topK);
    }
}


const getPrompt = (query, emails) => {
    // Format emails for ranking
    let emailsText = "";
    emails.forEach((email, index) => {
        // Truncate very long emails
        let body = email.content;
        if (body.length > 1200) {
            body = body.substring(0, 1200) + "...";
        }

        emailsText += `
EMAIL ${index + 1} (Date: ${email.receivedAt}, Similarity Score: ${email.similarityScore.toFixed(3)}):
${body}

---
            `;
    });

    const prompt = `Parent question: "${query}"

School emails to rank:
${emailsText}

- IMPORTANT: Some emails may contain metadata sections like **Topics**, **Likely Questions**. IGNORE these sections completely when ranking. Only consider the actual email content (**Date**, **Body**) sent by the school.
- The similarity scores show how well each email matches the query semantically - use this as additional context.
- Rank these emails from most relevant (1) to least relevant (${emails.length}) for answering the parent's question.

Consider:
- Which email best answers the specific question?
- Recent emails are generally more important for events/updates
- Specific information is better than general information
- Higher similarity scores suggest better semantic match
- IGNORE any **Topics**, **Likely Questions** sections

Respond with only the ranking as a JSON array: [email_number, email_number, ...]
Example: [3, 1, 5] means email 3 is most relevant, then email 1, then email 5.`;
    return prompt;
}