
import { z } from 'zod';
import OpenAI from "openai";
import { CloudClient } from "chromadb";
export const getPoliciesInfoTool = ({ openAIKey, policiesVectorStoreId }) => ({
    description: `This tool answers queries related to school policies:
-   Science Policy: like biological and physical world, scientific ideas 
-   Use of Photographs and Videos in school publicity materials, on the school website, social media pages and in the press
-   Geography Policy: natural and human environments in the locality, region, Ireland, Europe and the world 
-   Code of Behaviour Policy: Pupils behaviour incidents, This policy aims to support the pupil exhibiting Behaviours of Concern, other pupils, staff and the relevant parents.
-   Social, Personal and Health Education (SPHE) Policy:  Through SPHE, we seek to develop positive self-esteem, social and communication skills, appropriate expression of feelings as well as safety and protection skills in each child in our care.
-   Intimate Care Policy:  involves attending to a student when they are undressed or partially dressed; helping a student with washing (including intimate parts); helping atudent to use the toilet;
-   History Policy:  events in their own immediate past, the past of their families and local communities, and the history of people in Ireland and other parts of the world.
-   Data Protection Policy: This Data Protection Statement describes how we at Rathcoole Educate Together NS collect and process personal data, in accordance with the GDPR and the school's legal obligations generally in relation to the provision of education
-   Critical Incident Policy:  A critical incident is any incident or sequence of events which overwhelms the normal coping mechanisms of the school.
-   Communications Policy: procedures for the sharing of information in relation to pupil progress, needs and attainment.  Parent/caregiver-Teacher/Home School Communication
-   Anti-Bullying Policy
-   Code of Positive Behaviour: School Standards, rules, sanctions, suspension, minor behaviour incidents, serious behaviour incidents.

    `,
    inputSchema: z.object({
        userQuery: z.string().describe('The User query'),
    }),
    execute: async ({ userQuery }) => {
        const chromaClient = new CloudClient();        
        const openai = new OpenAI({ apiKey: openAIKey });

        const [collection, queryEmbedding] = await Promise.all([
            chromaClient.getCollection({ name: "policies_t" }),
            openai.embeddings.create({
                model: "text-embedding-3-small",
                input: userQuery
            })
        ]);

        const results = await collection.query({
            queryEmbeddings: [queryEmbedding.data[0].embedding],
            include:["distances","documents"],
            nResults: 15,
        });
        // 3. Build context from chunks
        const chunks = results.documents[0]; // documents is an array-of-arrays
        const context = chunks.join("\n---\n");

        // 4. Ask OpenAI to answer using only these chunks
        const response = await openai.responses.create({
            model: "gpt-4o-mini",
            input: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Answer only using the provided context. If you don't know, say so."
                },
                {
                    role: "user",
                    content: `Context:\n${context}\n\nQuestion: ${userQuery}`
                }
            ]
        });


        return response.output_text;
    }
})