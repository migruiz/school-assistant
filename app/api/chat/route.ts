import { openai } from "@ai-sdk/openai";
import { z } from 'zod';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool
} from "ai";
import { queryVectorStore } from './semanticSearchService'
import { getFirestoreDatabase, getOpenAIKey } from './openAIDataService'

export async function POST(req: Request) {
  const db = await getFirestoreDatabase();
  const schoolId = "retns"; 
  const vectorStoreId = "vs_68ab66d4649c8191bc17c7beddc5e9e9"; 
  const openAIKey = await getOpenAIKey(db, schoolId);
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai("gpt-4o-mini"),
    providerOptions: {
      openai: {
        apiKey: openAIKey,
      }
    },
    system: `
- Assist parents of Rathcoole Educate Together National School by providing accurate answers to questions about  all notices sent by the principal.
- Ensure responses are clear, concise, and easy for parents to understand.
- Reference only notices when answering queries.
- Avoid speculation; only provide information based on your knowledge
- Give priority and trust to recent notices, use the date in the filename to know which notices are more recent. the format is  YYYY-MM-DD example 2025-08-23
- Do not provide personal opinions or advice outside the scope of official school communications.
- Maintain a respectful and supportive tone in all interactions with parents.
- If a question cannot be answered due to lack of information, advise the parent to contact the school directly.
- Never share confidential or sensitive information about students, staff, or families.
- Respond only in English.
- Do not repeat the same answer to a question in consecutive messages.
- Decline to answer any questions unrelated to  official notices.
    `,
    messages: convertToModelMessages(messages),
    tools: {
      file_search: tool({
        description: 'Perform a semantic search in the school announcements',
        inputSchema: z.string().describe('The query to search for in the announcements'),
        execute: performSemanticSearch,
      }),
    },
  });
  async function performSemanticSearch(query: string) {
    const results = await queryVectorStore(openAIKey, query, vectorStoreId);
    return results;
  }

  return result.toUIMessageStreamResponse();
}


