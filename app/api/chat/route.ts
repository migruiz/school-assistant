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
import {searchCalendar} from './schoolCalendar'

export async function POST(req: Request) {
  const db = await getFirestoreDatabase();
  const schoolId = "retns";
  const vectorStoreId = "vs_68b4bb1b5ee08191ac76013fde8753f2";
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
- Use the school_knowledge_search tool when answering the queries, unless the answer is already known based on your context.
- The results from the school_knowledge_search tool may contain metadata sections like **Topics**, **Likely Questions**. IGNORE these sections completely. Only consider the actual content (**Date**, **Body**).
- Use ONLY the 'school_calendar' tool when answering queries related to school opening/closing dates and times. 
- Ensure responses are clear, concise, and easy for parents to understand.
- Do not provide personal opinions.
- Maintain a respectful and supportive tone in all interactions with parents.
- If after searching in your school_knowledge_search tool, the query cannot be answered due to lack of information, advise the parent to contact the school directly.
- Never share confidential or sensitive information about students, or families.
- Respond only in English.
- Today is ${new Date().toISOString().split('T')[0]}
- If the user query includes a relative date to Today (today, tomorrow, next week), always reason and use Today's date (${new Date().toISOString().split('T')[0]}) to reason and answer the query
    `,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {

      school_knowledge_search: tool({
        description: 'This will perform a search on the school knowledgebase based on the user query',
        inputSchema: z.object({
          query: z.string().describe('The query to search'),
        }),
        execute: async ({ query }) => await performSemanticSearch({ query }),
      }),
        'school_calendar': tool({
        description: `This tool answers all related to the school opening/closing dates and times, finish/collection times, and if there are any event that changes the normal schedule.
        It can also provide information about upcoming school holidays (Mid-Term Break, Winter Break, Half Days, Early Finish, Early Collections, etc.) that may change the normal schedule.
        The tool expects a search date range as parameter. You need to convert any relative dates (today, tomorrow, next week) in the user query to absolute dates.
        Make sure to use the date range you choose falls into the School Year (2025-09-01 to 2026-06-26)
        The tool uses the search date range to search the school calendar`,
        inputSchema: z.object({
          fromDate: z.string().describe('The Start Date in this format YYYY-MM-DD'),
          toDate: z.string().describe('The End Date in this format YYYY-MM-DD'),
        }),
        execute: async ({ fromDate, toDate }) => await searchCalendar({openAIKey, schoolCalendar, fromDate, toDate }),
      }),
    },
  });
  async function performSemanticSearch({ query }: { query: string }) {
    const results = await queryVectorStore(openAIKey, query, vectorStoreId);
    return results;
  }

  return result.toUIMessageStreamResponse();
}


