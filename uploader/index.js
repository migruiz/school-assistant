import { CloudClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import dotenv from 'dotenv'

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import OpenAI from "openai";


dotenv.config();

const openai = new OpenAI();
async function loadAndChunk(filePath) {
    let loader;

    if (filePath.endsWith(".pdf")) {
        loader = new PDFLoader(filePath);
    } else if (filePath.endsWith(".docx")) {
        loader = new DocxLoader(filePath);
    } else if (filePath.endsWith(".txt")) {
        loader = new TextLoader(filePath);
    } else {
        throw new Error("Unsupported file type");
    }

    // 1. Load and extract text into documents
    const docs = await loader.load();

    // 2. Chunk documents
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,     // adjust as needed
        chunkOverlap: 200,   // keeps context between chunks
    });

    const chunkedDocs = await splitter.splitDocuments(docs);
    return chunkedDocs;
}

(async () => {
    const name = "generalInfo";
    const client = new CloudClient();
    const collection = await client.getOrCreateCollection({
        name
    })

    const chunks = await loadAndChunk("example.pdf");
    for (const chunk of chunks) {
        console.log(`Chunk ${chunk.id}:`, chunk.pageContent.slice(0, 100));
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: chunk.pageContent,
        });
        const timestamp = new Date().getTime(); // current time in milliseconds
        const randomPart = Math.floor(Math.random() * 10000); // random 4-digit number


        await collection.add({
            ids: [`${timestamp}-${randomPart}`],
            embeddings: [response.data[0].embedding],
            documents: [chunk.pageContent],
             metadatas: [{"chapter": 3, "verse": 16}]
        })
    }

})();