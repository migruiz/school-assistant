
import { z } from 'zod';
import OpenAI from "openai";
export const getGeneralInfoTool = ({ openAIKey, generalInfoVectorStoreId }) => ({
    description: `This tool answers queries related to general school information like school address, Mission, Nurture, uniform, books and stationary,
    school bag, lunch box, free hot lunch scheme, nut allergies, tusla, luch time, food policies.
    Also, information related the Voluntary Contribution to the School, School Fees, Voluntary Contributions, requisite fees, payment methods.
    `,
    inputSchema: z.object({
        userQuery: z.string().describe('The User query'),
    }),
    execute: async ({ userQuery, }) => {
        const client = new OpenAI({ apiKey: openAIKey });

        const response = await client.responses.create({
            model: "gpt-4o-mini",
            input: userQuery,
            tools: [
                {
                    type: "file_search",
                    vector_store_ids: [generalInfoVectorStoreId],
                },
            ],
        });

        const result = response.output_text;

        return result;
    }
})