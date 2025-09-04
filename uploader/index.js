import { CloudClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import dotenv from 'dotenv'

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

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
function getNewId({ fileName, chunkId }) {
    const timestamp = new Date().getTime();
    return `${fileName}-${chunkId}-${timestamp}`;
}
const folderToEmbed = "C:\\repos\\retns\\static";
const client = new CloudClient();
(async () => {

    const name = "generalInfo";





    const folders = fs.readdirSync(folderToEmbed, { withFileTypes: true }).filter(f => f.isDirectory())
    for (const folder of folders) {
        const folderPath = path.join(folderToEmbed, folder.name);
        const files = fs.readdirSync(folderPath, { withFileTypes: true }).filter(f => !f.isDirectory())

        const collection = await client.getOrCreateCollection({
            name: folder.name
        });
        for (const file of files) {
            const fileName = file.name;
            const filePath = path.join(folderPath, fileName);

            const chunks = await loadAndChunk(filePath);
            for (const chunk of chunks) {
                const chunkId = chunks.indexOf(chunk) + 1;
                const text = chunk.pageContent;
                const embedding = await embed(text);
                const id = getNewId({ fileName, chunkId });
                await collection.add({
                    ids: [id],
                    embeddings: [embedding],
                    documents: [text],
                    metadatas: [{ fileName }]
                })
            }
        }
    }





})();