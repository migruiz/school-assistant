import OpenAI, { Uploadable } from "openai";
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
All emails come from the school principal and relate to school events, staff, classes, or general school information.

Given an email object in JSON format, perform the following tasks:

1. Generate a concise, embedding-friendly summary of the email body (max ~200 characters). Focus only on the main content, ignoring greetings, signatures, and redundant text.
2. Create a new subject line that accurately reflects the content of the email.
3. Extract 1–5 relevant categories describing the email content. Prefer school-specific categories, such as:
   - Class Updates
   - School Event
   - Holiday / Closure
   - Announcement / General Information
   - Staff Update
   - Parent Carer Association
   - Bus Information

Return your result as a JSON object with this structure:
{
  "subject": <generated subject>,
  "summary": <embedding-friendly summary>,
  "categories": [<category1>, <category2>, ...]
}

Here is the email object to process:
${JSON.stringify(content)}
`;

}