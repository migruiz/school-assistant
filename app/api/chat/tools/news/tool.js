
import { z } from 'zod';
import { search } from '@/lib/semanticSearch';
import { reRank } from '@/lib/reRanker';
export const getSearchNewsTool = ({ openAIKey, userAllowedSchoolClasses }) => ({
    description: `This tool searches information in the school news/announcements from the school, also searches in the respective school class("juniorInfants", "1stClass", "2ndClass", "3rdClass") news/announcments.
     if a specific class is specified then pass it in the schoolClass parameter.
     The tools returns the relevant news found by class ("allSchool", "juniorInfants", "1stClass", "2ndClass", "3rdClass")
     `,
    inputSchema: z.object({
        userQuery: z.string().describe('The User query'),
        schoolClass: z.enum(["juniorInfants", "1stClass", "2ndClass", "3rdClass"])
            .nullable()
            .optional()
            .describe("School Class to filter, null if not specified"),
    }),
    execute: async ({ userQuery, schoolClass }) => {
        if (schoolClass) {
            if (userAllowedSchoolClasses.includes(schoolClass)) {
                return await searchAndReRank({openAIKey, query:userQuery, schoolClass, numberOfChunks:25, rankTopK:5})
            }
            else {
                return "Sorry, You don't have access to this School Class News"
            }
        } else {
            const allSchoolNewsPromise = searchAndReRank({openAIKey, query:userQuery, schoolClass:"allSchool", numberOfChunks:25, rankTopK:5})
            const userAllowedClassesNewsPromises = userAllowedSchoolClasses.map(s => searchAndReRank({openAIKey, query:userQuery, schoolClass:s, numberOfChunks:25, rankTopK:5}))
            const filteredNewsLists = await Promise.all([
                allSchoolNewsPromise,
                ...userAllowedClassesNewsPromises
            ]);
            return filteredNewsLists;
        }

    }
})

const searchAndReRank = async ({openAIKey, query, schoolClass, numberOfChunks,rankTopK }) => {
    const chunks = await search({ query, schoolClass, numberOfResults:numberOfChunks });
    const refined = await reRank({ openAIKey, query, semanticSearchResults: chunks, topK:rankTopK });
    return {schoolClassName:schoolClass, searchResults:refined};

}