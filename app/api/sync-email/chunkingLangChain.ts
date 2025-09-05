import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
export async function chunkEmailUsingLangChain(content: string) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
    });

    const output = await splitter.createDocuments([content]);    
    return output;

}


