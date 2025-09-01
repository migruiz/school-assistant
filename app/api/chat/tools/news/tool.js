
import { z } from 'zod';
import { performSemanticSearch } from './newsService'
export default getTool = ({ openAIKey, vectorStoreId }) => ({
        description: 'This will perform a search on the school knowledgebase based on the user query',
        inputSchema: z.object({
          query: z.string().describe('The query to search'),
        }),
        execute: async ({ query }) => await performSemanticSearch({ openAIKey, query, vectorStoreId }),
      })