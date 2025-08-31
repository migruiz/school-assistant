import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreDatabase, getEmailsAccountToSync, getGmailAppCredentials, updateLastHistoryId, getGmailApiClient, updateEmailAccountWithVectorStoreId } from './emailAccountService'
import { getSchools } from "./schoolsService"
import OpenAI from "openai";

export async function POST(req: NextRequest) {

  const db = await getFirestoreDatabase();

  const schools = await getSchools(db);

  for (const school of schools) {

    const client = new OpenAI({
      apiKey: school.openAIKey
    });

    const emailsAccountsToSync = await getEmailsAccountToSync(db, school.id);
    for (const emailAccountToSync of emailsAccountsToSync) {
      const vectorStoreId = emailAccountToSync.vectorStoreId;
      const vectorFiles = await client.vectorStores.files.list(
        vectorStoreId
      );
      for (const file of vectorFiles.data){
        const deleteResult = await client.vectorStores.files.delete(file.id, {vector_store_id: vectorStoreId});
        console.log("Deleted vector file:", deleteResult);
      }
    }
    const allFiles = await client.files.list();
    for (const file of allFiles.data) {
      const deleteResult = await client.files.delete(file.id);
      console.log("Deleted file:", deleteResult);
    }
  }








  return NextResponse.json({ success: true, emails: [] });
}


