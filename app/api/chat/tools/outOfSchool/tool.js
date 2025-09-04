
import { z } from 'zod';
import { search } from '@/lib/semanticSearch';
export const getOutOfSchoolTool = ({ openAIKey, childCareServicesDataVectorStoreId, afterSchoolDataVectorStoreId }) => ({
    description: `This tool answers queries related to out of school activities, like childcare services (breakfast club) and after school programs like STEAM, chess, Dancing Clubs
    If user queries about Lily's then it refers to Childcare services.
    `,
    inputSchema: z.object({
        userQuery: z.string().describe('The User query'),
        types: z.array(z.enum(["afterSchool", "childCare"])).describe('The type of out of school activity to search for. afterSchool: After School Activities like STEAM, chess, Dancing Clubs. childCare: Childcare services like breakfast club'),
    }),
    execute: async ({ userQuery, types }) => {
        if (types.includes("afterSchool")) {
            const chunks = await search({ query: userQuery, collectionName: "afterschool_t", numberOfResults: 15 });
            return chunks;
        }
        if (types.includes("childCare")) {
            const chunks = await search({ query: userQuery, collectionName: "childcare_t", numberOfResults: 15 });
            return chunks;
        }
    }
})