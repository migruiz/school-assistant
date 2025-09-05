import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
export async function chunkEmailUsingLangChain(content: string) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1200,
        chunkOverlap: 400,
    });

    const output = await splitter.createDocuments([content]);    
    return output;

}


