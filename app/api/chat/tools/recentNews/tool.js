
import { z } from 'zod';
import { CloudClient } from "chromadb";
export const getRecentNewsTool = ({ collectionName }) => ({
    description: `This tool returns the recent school announcments/news in ASCENDING order from the last days.
    The most important news are the most recent (The Last items on the list)`,
    inputSchema: z.object({
        xDaysAgo: z.number().describe('How many days ago to look in the past '),
    }),
    execute: async ({ xDaysAgo }) => {
        const chromaClient = new CloudClient();
        const collection = await chromaClient.getCollection({ name: collectionName })


        const now = Date.now();
        const startDate = now - (xDaysAgo * 24 * 60 * 60 * 1000);

        const results = await collection.get({
            where: { "receivedAtTS": { "$gte": startDate } }
        });
        // 3. Build context from chunks
        const docs = results.documents; // documents is an array-of-arrays
        return docs;
    }
})