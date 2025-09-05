import OpenAI from "openai";
export async function chunkEmail(openAIKey: string, content: string) {
    // Initialize OpenAI client with your API key
    const openai = new OpenAI({
        apiKey: openAIKey
    });


    const prompt = getPrompt(content);
    const systemPrompt = getSystemPrompt();


    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt},
            { role: "user", content: prompt }
        ],
        temperature: 0
    });

    const result = response.choices[0].message.content as string;
    return JSON.parse(result);

}


function getSystemPrompt(){
    return `
    You are an expert text-chunking assistant.
Your task is to take an input email or long document and break it into semantic chunks that are:

Self-contained and understandable on their own.

Suitable for embeddings (approx. 100–200 words per chunk, but flexible depending on content).

Organized by topic/section.

Concise (remove redundant greetings, signatures, and filler unless needed for context).

Output strictly as a JSON array where each element is an object with:

"chunk_id": sequential number starting from 1

"title": short descriptive title of the chunk

"text": the chunk content

Return only valid JSON with no markdown, no json fences, no commentary.
Do not output anything outside the JSON.
    `
}

function getPrompt(content: any) :string{

    return `
Chunk this email into embedding-friendly JSON output:
${content}
`;

}