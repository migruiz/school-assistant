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
import {getSchoolCalendarTool} from './tools/schoolCalendar/tool'
import {getNewsTool} from './tools/news/tool'
import {getOutOfSchoolTool} from './tools/outOfSchool/tool'

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
- Use the tools provided to find accurate information to answer the query.
- Make sure to ALWAYS  search in School News as important updates and information are often posted there, even if you consider that is not needed.
- Ensure responses are clear, concise, and easy for parents to understand.
- Do not provide personal opinions.
- Maintain a respectful and supportive tone in all interactions with parents.
- If the query cannot be answered due to lack of information, advise the parent to contact the school directly.
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
      outOfSchool: tool(getOutOfSchoolTool())
    },
  });

  return result.toUIMessageStreamResponse();
}


