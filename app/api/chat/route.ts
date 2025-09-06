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
import { getSchoolCalendarTool } from './tools/schoolCalendar/tool'
import { getSearchNewsTool } from './tools/news/tool'
import { getOutOfSchoolTool } from './tools/outOfSchool/tool'
import { getGeneralInfoTool } from './tools/generalInfo/tool'
import { getPoliciesInfoTool } from './tools/policies/tool'
import {getRecentNewsTool} from './tools/recentNews/tool'

export async function POST(req: Request) {
  const db = await getFirestoreDatabase();
  const schoolId = "retns";
  const collectionNameRETNS = "wholeSchoolAnnouncements";
  const userAllowedSchoolClasses = ["JuniorInfants","3rdClass"]
  const { openAIKey, schoolCalendar, generalInfoVectorStoreId, childCareServicesDataVectorStoreId, afterSchoolDataVectorStoreId, policiesVectorStoreId } = await getSchoolInfo(db, schoolId);
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
      recentNews: tool(getRecentNewsTool({schoolNewsCollection:collectionNameRETNS, userAllowedSchoolClasses})),
      searchNews: tool(getSearchNewsTool({ openAIKey, collectionName:`${collectionNameRETNS}-chunks-langChain`})),
      schoolCalendar: tool(getSchoolCalendarTool({ openAIKey, schoolCalendar })),
      outOfSchool: tool(getOutOfSchoolTool({ openAIKey, childCareServicesDataVectorStoreId, afterSchoolDataVectorStoreId })),
      generalInfo: tool(getGeneralInfoTool({ openAIKey, generalInfoVectorStoreId })),
      policies: tool(getPoliciesInfoTool({ openAIKey, policiesVectorStoreId })),
    },
  });

  return result.toUIMessageStreamResponse();
}


