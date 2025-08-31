import OpenAI from "openai";
export async function summarizeForSemanticSearch(openAIKey: string, content: any) {
    // Initialize OpenAI client with your API key
    const openai = new OpenAI({
        apiKey: openAIKey
    });


    const prompt = getPrompt(content);


    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant for processing school announcement emails." },
            { role: "user", content: prompt }
        ],
        temperature: 0
    });

    const result = response.choices[0].message.content as string;
    return JSON.parse(result);

}


function getPrompt(content: any) :string{

    return `
You are an assistant that processes school announcement emails for semantic search.
All emails come from the school and relate to school events, staff, classes, or general school information.

Given an email object in JSON format, Extract and Respond with only valid JSON. Do not include any text, explanations, or code fences.

Properties to Extract:

"summary": A concise, embedding-friendly summary of the email body (max ~200 characters). Focus only on the main content, ignoring greetings, signatures, and redundant text.
"newSubject": A new subject line that accurately reflects the content of the email.
"categories": relevant categories describing the email content (max 5). Prefer school-specific categories, such as:
   - School Event
   - Closure
   - General Information
   - Staff/Teacher Update
   - Parent Carer Association
   - Bus Information
"eventUpdates": Any event changes/new events with dates
"likelyQuestions": Questions parents might ask about this content (max 8)



Here is the email object to process:
${JSON.stringify(content)}
`;

}