
import { z } from 'zod';
import { CloudClient } from "chromadb";
export const getRecentNewsTool = ({ schoolNewsCollection, userAllowedSchoolClasses }) => ({
    description: `This tool returns the recent school announcments/news in ASCENDING order from the last days.
    The most important news are the most recent (The Last items on the list)
    The user could ask for news of a specific school class i.e "Recent news from Junior Infants" => schoolClass = "JuniorInfants"
    or no school class i.e. "Recent news" => schoolClass = null
    `,
    inputSchema: z.object({
        xDaysAgo: z.number().describe('How many days ago to look in the past '),
        schoolClass: z.enum(["JuniorInfants", "1stClass", "2ndClass", "3rdClass"])
            .nullable()
            .optional()
            .describe("List of school classes to filter by. [] if not school class queried"),
    }),
    execute: async ({ xDaysAgo, schoolClass }) => {
        const chromaClient = new CloudClient();
        if (schoolClass) {
            if (userAllowedSchoolClasses.includes(schoolClass)) {
                //const classNewsCollectionName = `${schoolClass}-originals`
                const classNewsCollectionName='juniorclassannouncments-originals'
                const collection = await chromaClient.getCollection({ name: classNewsCollectionName })


                const now = Date.now();
                const startDate = now - (xDaysAgo * 24 * 60 * 60 * 1000);

                const results = await collection.get({
                    where: { "receivedAtTS": { "$gte": Math.floor(startDate / 1000) } }
                });
                // 3. Build context from chunks
                const docs = results.documents; // documents is an array-of-arrays
                return docs;
            }
            else {
                return "Sorry, You don't have access to this School Class News"
            }
        }
        else {
            const schoolNewsCollectionName = `${schoolNewsCollection}-originals`
            const collection = await chromaClient.getCollection({ name: schoolNewsCollectionName })


            const now = Date.now();
            const startDate = now - (xDaysAgo * 24 * 60 * 60 * 1000);

            const results = await collection.get({
                where: { "receivedAtTS": { "$gte": Math.floor(startDate / 1000) } }
            });
            // 3. Build context from chunks
            const docs = results.documents; // documents is an array-of-arrays
            return docs;
        }
    }
})