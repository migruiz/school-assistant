
import { z } from 'zod';
import { search } from '@/lib/semanticSearch';
import { reRank } from '@/lib/reRanker';
export const getNewsTool = ({ openAIKey, collectionName }) => ({
    description: `This tool searches information in the school news/announcements from the school principal.`,
    inputSchema: z.object({
        userQuery: z.string().describe('The User query'),
    }),
    execute: async ({ userQuery }) => {
        const chunks = await search({ query: userQuery, collectionName, numberOfResults: 25 });
        const refined = await reRank({ openAIKey, query: userQuery, semanticSearchResults: chunks, topK: 5 });
        return refined;
    }
})