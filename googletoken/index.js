const { google } = require('googleapis');
const oAuth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
});
console.log('Authorize this app by visiting this url:', authUrl);


const code = 'PASTE_CODE_HERE';
oAuth2Client.getToken(CODE).then(({ tokens }) => {
  console.log('Refresh token:', tokens.refresh_token);
});

