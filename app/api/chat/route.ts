import { openai } from "@ai-sdk/openai";
import { z } from 'zod';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs
} from "ai";
import { getFirestoreDatabase, getSchoolInfo } from './openAIDataService'
import getSchoolCalendarTool from './tools/schoolCalendar/tool'
import getNewsTool from './tools/news/tool'

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
      schoolNews: tool(getNewsTool({ openAIKey, vectorStoreId })),
      schoolCalendar: tool(getSchoolCalendarTool({openAIKey, schoolCalendar})),
    },
  });

  return result.toUIMessageStreamResponse();
}


