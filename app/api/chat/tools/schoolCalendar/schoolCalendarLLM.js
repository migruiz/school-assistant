import OpenAI from "openai";

export const searchCalendar = async ({openAIKey, schoolCalendar, fromDate, toDate }) => {
    const openai = new OpenAI({
        apiKey: openAIKey
    });
    const prompt = getPrompt({ schoolCalendar, fromDate, toDate });

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant that gets information about the school calendar, based on the provided dates." },
            { role: "user", content: prompt }
        ],
        temperature: 0
    });




    const result = response.choices[0].message.content.trim();

    return result;
}


const getPrompt = ({ schoolCalendar, fromDate, toDate }) => {
    const prompt = `
Query: "Show information about the school calendar from ${fromDate} to ${toDate}"

Use The following School Calendar to answer:
${schoolCalendar}

`;
    return prompt;
}