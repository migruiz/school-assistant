
import { z } from 'zod';
import { performSemanticSearch } from './newsService'
export const  getNewsTool = ({ openAIKey, vectorStoreId }) => ({
        description: `
        This tool searches information in the school news/announcements. This tool should be called most of the times to answer the parent query, as the news contains important updates and information.        
        The results from this tool may contain metadata sections like **Topics**, **Likely Questions**. IGNORE these sections completely. Only consider the actual content (**Date**, **Body**)`,
        inputSchema: z.object({
          query: z.string().describe('The query to search'),
        }),        
        execute: async ({ query }) => await performSemanticSearch({ openAIKey, query, vectorStoreId }),
      })