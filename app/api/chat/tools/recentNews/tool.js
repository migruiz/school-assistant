
import { z } from 'zod';
import { CloudClient } from "chromadb";
export const getRecentNewsTool = ({ collectionName }) => ({
    description: `This tool returns the recent school announcments/news from the last days.`,
    inputSchema: z.object({
        xDaysAgo: z.number().describe('How many days ago to look in the past '),
    }),
    execute: async ({ xDaysAgo }) => {
        const chromaClient = new CloudClient();
        const collection = await chromaClient.getCollection({ name: collectionName })


        const now = new Date();
        now.setDate(now.getDate() - xDaysAgo);
        const startDate = now.toISOString();

        const results = await collection.get({
            where: { "receivedAt": { "$gte": startDate } }
        });
        // 3. Build context from chunks
        const docs = results.documents[0]; // documents is an array-of-arrays
        return docs;
    }
})