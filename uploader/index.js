import { CloudClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import dotenv from 'dotenv'

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";



dotenv.config();

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

    const chunks = await loadAndChunk("example.pdf");
    chunks.forEach((c, i) => {
        console.log(`Chunk ${i}:`, c.pageContent.slice(0, 100));
    });
    return;



    const name = "generalInfo";
    const client = new CloudClient();
    const collection = await client.getOrCreateCollection({
        name: "generalInfo",
        embeddingFunction: new OpenAIEmbeddingFunction({
            apiKey: process.env.OPENAI_API_KEY,
            modelName: "text-embedding-3-small"
        })
    })
    await collection.add({
        ids: ["id1", "id2", "id3"],
        documents: ["lorem ipsum...", "doc2", "doc3"],
        metadatas: [{ "chapter": 3, "verse": 16 }, { "chapter": 3, "verse": 5 }, { "chapter": 29, "verse": 11 }],
    });
})();