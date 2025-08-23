import { openai } from "@ai-sdk/openai";
import {
  streamText,
  UIMessage,
  convertToModelMessages,
} from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai("gpt-4o"),
    system:"You are a helpful assistant. Answer the user's question only from the file_search tool. This tool is only for school announcements. Dont use this tool for anything else.",
    messages: convertToModelMessages(messages),
    tools: {
      file_search: openai.tools.fileSearch({vectorStoreIds: ['vs_68a7a07d66fc8191b9666c3d763e6dc5']}),
    },
  });

  return result.toUIMessageStreamResponse();
}
