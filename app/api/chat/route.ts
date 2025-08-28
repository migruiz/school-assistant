import { openai } from "@ai-sdk/openai";
import { z } from 'zod';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs
} from "ai";
import { queryVectorStore } from './semanticSearchService'
import { getFirestoreDatabase, getSchoolInfo } from './openAIDataService'
import {queryGeneralInfoVectorStore} from './generalInfoService'

export async function POST(req: Request) {
  const db = await getFirestoreDatabase();
  const schoolId = "retns";
  const vectorStoreId = "vs_68b08ed54894819185dd772705d40063";
  const { openAIKey, schoolCalendar, generalInfoVectorStoreId } = await getSchoolInfo(db, schoolId);
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai("gpt-4o-mini"),
    providerOptions: {
      openai: {
        apiKey: openAIKey,
      }
    },
    system: `
- Assist parents of Rathcoole Educate Together National School by providing accurate answers to school queries.
- Always use the school_knowledge_search tool when answering the queries, unless the answer is already known based on your context.
- The semantic search result from the school_knowledge_search have these fields: Subject, Summary, Categories, and the Date of the announcement in the format of ISO 8601 format with UTC time zone, e.g. YYYY-MM-DDTHH:MM:SS.sssZ. Give more priority to recent results.
- Ensure responses are clear, concise, and easy for parents to understand.
- Do not provide personal opinions.
- Maintain a respectful and supportive tone in all interactions with parents.
- If after searching in your school_knowledge_search tool, the query cannot be answered due to lack of information, advise the parent to contact the school directly.
- Never share confidential or sensitive information about students, or families.
- Respond only in English.
    `,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {

      school_knowledge_search: tool({
        description: 'This will perform a semantic search on the school knowledge based on the user query',
        inputSchema: z.object({
          query: z.string().describe('The query to search'),
        }),
        execute: async ({ query }) => await performSemanticSearch({ query }),
      }),
    },
  });
  async function performSemanticSearch({ query }: { query: string }) {
    const results = await queryVectorStore(openAIKey, query, vectorStoreId);
    console.log(JSON.stringify(results, null, 2));
    return results;
  }

  return result.toUIMessageStreamResponse();
}


