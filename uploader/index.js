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
        chunkOverlap: 300,   // keeps context between chunks
    });

    const chunkedDocs = await splitter.splitDocuments(docs);
    return chunkedDocs;
}
async function embed(text) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });
    return response.data[0].embedding
}
function getNewId() {
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 10000);
    return `${timestamp}-${randomPart}`;
}

(async () => {
    const name = "generalInfo";
    const client = new CloudClient();
    const collection = await client.getOrCreateCollection({
        name
    });

    const filename = "example.pdf";

    const chunks = await loadAndChunk(filename);
    for (const { pageContent } of chunks) {
        const embedding = await embed(pageContent);
        const id = getNewId();
        await collection.add({
            ids: [id],
            embeddings: [embedding],
            documents: [pageContent],
            metadatas: [{ filename }]
        })
    }

})();