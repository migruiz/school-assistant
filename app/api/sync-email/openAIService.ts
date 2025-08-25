import OpenAI, { Uploadable } from "openai";
import {summarizeForSemanticSearch} from './summarizerService'
export async function importEmails(openAIKey: string, vectorStoreId: string, vectorStoreName: string, emails: any) {
    if (emails.length === 0) {
        return null;
    }
    const client = new OpenAI({ apiKey: openAIKey });

    let vectorStore;
    let createdVectorStoreId = null;
    if (!vectorStoreId) {
        vectorStore = await client.vectorStores.create({   // Create vector store
            name: vectorStoreName,
        });
        createdVectorStoreId = vectorStore.id;
    }
    else {
        vectorStore = await client.vectorStores.retrieve(vectorStoreId);
    }


    for (const email of emails.reverse()) {
        const summaryData = await summarizeForSemanticSearch(openAIKey, {
            subject: email.subject,
            body: email.body
        });
        const dataToUpload = {
            date: email.receivedAt,
            subject: summaryData.subject,
            summary: summaryData.summary,
            categories: summaryData.categories.join(","),
            content: email.body,
            
        };        
        const documentForSemanticSearch = formatDocumentForSemanticSearch(dataToUpload);
        const fileToUpload: Uploadable = new File([documentForSemanticSearch], `${email.subject} - ${email.id}.json`, { type: "application/json" });
        const uploadedFile = await client.vectorStores.files.uploadAndPoll(
            vectorStore.id,
            fileToUpload
        );

        const attributesUploaded  = await client.vectorStores.files.update(uploadedFile.id, {
            vector_store_id: vectorStore.id,
            attributes: {
                sender: email.sender,
                originalSubject: email.subject,
                receivedAt: new Date(email.receivedAt).getTime(),
            },
        });
        console.log("Uploaded Data:", JSON.stringify(documentForSemanticSearch, null, 2));
        console.log("Result:", JSON.stringify({uploadedFile, attributesUploaded}, null, 2));
    }


    return createdVectorStoreId;
}

function formatDocumentForSemanticSearch(dataToUpload:any) {

  let result = `**Subject**: ${dataToUpload.subject}\n`;
    result += `**Date**: ${dataToUpload.date}\n`;    
    result += `**Categories**: ${dataToUpload.categories}\n`;
    result += `**Summary**: \n`;
    result += `${dataToUpload.summary}\n\n`;
    result += `**Content**: \n`;
    result += `${dataToUpload.content}\n`;

  return result.trim();
}
