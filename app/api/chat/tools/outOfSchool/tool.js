
import { z } from 'zod';
import OpenAI from "openai";
export const getOutOfSchoolTool = ({ openAIKey, childCareServicesDataVectorStoreId, afterSchoolDataVectorStoreId }) => ({
    description: `This tool answers queries related to out of school activities, like childcare services (breakfast club) and after school programs like STEAM, chess, Dancing Clubs
    If user queries about Lily's then it refers to Childcare services.
    `,
    inputSchema: z.object({
        userQuery: z.string().describe('The User query'),
        types: z.array(z.enum(["afterSchool", "childCare"])).describe('The type of out of school activity to search for. afterSchool: After School Activities like STEAM, chess, Dancing Clubs. childCare: Childcare services like breakfast club'),
    }),
    execute: async ({ userQuery, types }) => {
        let results = []
        if (types.includes("afterSchool")) {
            const client = new OpenAI({ apiKey: openAIKey });

            const response = await client.responses.create({
                model: "gpt-4o-mini",
                input: userQuery,
                tools: [
                    {
                        type: "file_search",
                        vector_store_ids: [afterSchoolDataVectorStoreId],
                    },
                ],
            });

            const result = response.output_text;

            return result;
        }
        if (types.includes("childCare")) {
                        const client = new OpenAI({ apiKey: openAIKey });

            const response = await client.responses.create({
                model: "gpt-4o-mini",
                input: userQuery,
                tools: [
                    {
                        type: "file_search",
                        vector_store_ids: [childCareServicesDataVectorStoreId],
                    },
                ],
            });

            const result = response.output_text;

            return result;
        }
        return results.join(" /n")
    }
})