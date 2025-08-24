import { NextRequest, NextResponse } from 'next/server';

import { getFirestoreDatabase, getEmailAccountToSync, getGmailAppCredentials, updateLastHistoryId, getGmailApiClient } from './credentialsFactory'
import { getAddedEmails, getEmailDetails, getLast3Emails } from './emailParser'



export async function POST(req: NextRequest) {

  const db = await getFirestoreDatabase();
  const gmailAppCredentials = await getGmailAppCredentials(db);
  const emailsAccountsToSync = await getEmailAccountToSync(db);

  if (!gmailAppCredentials) {
    throw new Error('Gmail app credentials not found');
  }

  try {

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
        const { emails, lastHistoryId } = await getLast3Emails(gmail);
        historyIdToSync = lastHistoryId;
        emailsToSync = emails;
      }

      //sync here

      // Update lastHistoryId in Firestore if changed
      if (historyIdToSync && historyIdToSync !== emailAccountToSync.lastHistoryId) {
        await updateLastHistoryId({
          db,
          emailAccountId: emailAccountToSync.emailAccountId,
          newLastHistoryId: historyIdToSync
        });
      }
    }


    return NextResponse.json({ success: true, emails: [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
