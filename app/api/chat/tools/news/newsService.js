import { queryVectorStore } from './semanticSearchService'
export async function performSemanticSearch({ openAIKey, query, vectorStoreId }) {
    const results = await queryVectorStore(openAIKey, query, vectorStoreId);
    return results;
}