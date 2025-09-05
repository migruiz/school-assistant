import { NextRequest, NextResponse } from 'next/server';

import { getFirestoreDatabase, getEmailsAccountToSync, getGmailAppCredentials, updateLastHistoryId, getGmailApiClient } from './emailAccountService'
import { getAddedEmails, getLast30Emails } from './emailsService'
import { importEmails } from './openAIService'
import { getSchools } from "./schoolsService"



export async function POST(req: NextRequest) {

  const db = await getFirestoreDatabase();
  const gmailAppCredentials = await getGmailAppCredentials(db);

  const schools = await getSchools(db);
  for (const school of schools) {

    const emailsAccountsToSync = await getEmailsAccountToSync(db, school.id);

    if (!gmailAppCredentials) {
      throw new Error('Gmail app credentials not found');
    }


    for (const emailAccountToSync of emailsAccountsToSync) {
      const gmail = getGmailApiClient(gmailAppCredentials, emailAccountToSync.gmailRefreshToken);

      let lastSyncedHistoryId = emailAccountToSync.lastHistoryId;
      let emailsToSync: any[] = [];
      let historyIdToSync;

      if (lastSyncedHistoryId) {
        const { emails, lastHistoryId } = await getAddedEmails(gmail, lastSyncedHistoryId);
        historyIdToSync = lastHistoryId;
        emailsToSync = emails;
      } else {
        const { emails, lastHistoryId } = await getLast30Emails(gmail);
        historyIdToSync = lastHistoryId;
        emailsToSync = emails;
      }

      await importEmails(school.openAIKey,  emailAccountToSync.purpose, emailsToSync);

      // Update lastHistoryId in Firestore if changed
      if (historyIdToSync && historyIdToSync !== emailAccountToSync.lastHistoryId) {
        await updateLastHistoryId({
          db,
          schoolId: school.id,
          emailAccountId: emailAccountToSync.emailAccountId,
          newLastHistoryId: historyIdToSync
        });
      }
    }



  }





  return NextResponse.json({ success: true, emails: [] });
}
