
import { z } from 'zod';
import { search } from '@/lib/semanticSearch';
import { reRank } from '@/lib/reRanker';
export const getSearchNewsTool = ({ openAIKey, collectionName }) => ({
    description: `This tool searches information in the school news/announcements from the school, if a specific class is specified then pass it in the schoolClass parameter`,
    inputSchema: z.object({
        userQuery: z.string().describe('The User query'),
        schoolClass: z.enum(["juniorInfants", "1stClass", "2ndClass", "3rdClass"])
            .nullable()
            .optional()
            .describe("School Class to filter, null if not specified"),
    }),
    execute: async ({ userQuery, schoolClass }) => {
        const schoolClassToUse = schoolClass ?? "allSchool"
        const chunks = await search({ query: userQuery, schoolClass: schoolClassToUse, numberOfResults: 25 });
        const refined = await reRank({ openAIKey, query: userQuery, semanticSearchResults: chunks, topK: 5 });
        return refined;
    }
})