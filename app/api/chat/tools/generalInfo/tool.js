
import { z } from 'zod';
import { search } from '@/lib/semanticSearch';
import { reRank } from '@/lib/reRanker';
export const getGeneralInfoTool = ({ openAIKey, generalInfoVectorStoreId }) => ({
    description: `This tool answers queries related to general school information like school address, Mission, Nurture, uniform, books and stationary,
    school bag, lunch box, free hot lunch scheme, nut allergies, tusla, luch time, food policies.
    Also, information related the Voluntary Contribution to the School, School Fees, Voluntary Contributions, requisite fees, payment methods.
    `,
    inputSchema: z.object({
        userQuery: z.string().describe('The User query'),
    }),
    execute: async ({ userQuery }) => {
        const chunks = await search({ query: userQuery, collectionName: "generalInfo_t", numberOfResults: 20 });
        const refined = await reRank({ openAIKey, query: userQuery, semanticSearchResults: chunks, topK: 4 });
        return refined;
    }
})