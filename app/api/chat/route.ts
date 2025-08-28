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
  const vectorStoreId = "vs_68ab66d4649c8191bc17c7beddc5e9e9";
  const { openAIKey, schoolCalendar, generalInfoVectorStoreId } = await getSchoolInfo(db, schoolId);
  const request = await req.json();
  const { messages }: { messages: UIMessage[] } = request;
  const result = streamText({
    model: openai("gpt-5-nano"),
    providerOptions: {
      openai: {
        apiKey: openAIKey,
      }
    },
    system: `
- Assist parents of Rathcoole Educate Together National School by providing accurate answers to questions about: announcements sent by the principal, general school information, school calendar
- Ensure responses are clear, concise, and easy for parents to understand.
- Reference only information provided in your tools when answering queries.
- Use the tools in this order: announcementsSearch, generalInfoSearch, schoolCalendarSearch
- Avoid speculation; if unable to answer the question, try using the provided tools. If still unable to answer, advise the parent to contact the school directly.
- Give priority and trust to recent announcements, use the Date in the file to know which notices are more recent. the format is ISO 8601 format with UTC time zone, e.g. YYYY-MM-DDTHH:MM:SS.sssZ
- Do not provide personal opinions or advice outside the scope of official school communications.
- Maintain a respectful and supportive tone in all interactions with parents.
- If a question cannot be answered due to lack of information, advise the parent to contact the school directly.
- Never share confidential or sensitive information about students, staff, or families.
- Respond only in English.
- Do not repeat the same answer to a question in consecutive messages.
- Decline to answer any questions unrelated to  official notices.
    `,
    messages: convertMMessages(messages),
  
    stopWhen: stepCountIs(5),
    tools: {

      announcementsSearch: tool({
        description: 'Perform a semantic search in the school announcements',
        inputSchema: z.object({
          query: z.string().describe('The query to search for in the announcements'),
        }),
        execute: async ({ query }) => await performSemanticSearch({ query }),
      }),
      schoolCalendarSearch: tool({
        description: 'Use this when asked about the school calendar, school holidays, closures, or opening dates',
        inputSchema: z.object({}),
        execute:  () => schoolCalendar
      }),
      generalInfoSearch: tool({
        description: 'Perform a semantic search in the general information vector store like childcare information, school policies, and other general inquiries',
        inputSchema: z.object({
          query: z.string().describe('The query to search for in the general information'),
        }),
        execute: async ({ query }) => await queryGeneralInfoVectorStore(openAIKey, query, generalInfoVectorStoreId),
      }),
    },
  });
  async function performSemanticSearch({ query }: { query: string }) {
    const results = await queryVectorStore(openAIKey, query, vectorStoreId);
    console.log(JSON.stringify(results, null, 2));
    return results;
  }

    return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages:messagesFinished }) => {
      console.log("Chat finished. Saving chat...");
    },
  });
}

const convertMMessages = (messages:any[])=>{
  const converted = convertToModelMessages(messages);
  let last = { ...converted[converted.length - 1] };
  last.content = "who are you";
  last.role = "user";  
  return [last];
}


