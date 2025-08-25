const { google } = require('googleapis');
const oAuth2Client = new google.auth.OAuth2(
  '564895268744-guki0rcqlpuullgklf4959140ucmlr5g.apps.googleusercontent.com',
  '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',
  'http://localhost:3000/api/oauth2callback'
);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
});
console.log('Authorize this app by visiting this url:', authUrl);


const code = '4/0AVMBsJjJx1SSzKpSx5pldpCuUWxm-P1hLXPHXzRC2tgLliqNkt2rCoHLr1VLmYdm9FWJMg';
oAuth2Client.getToken(code).then(({ tokens }) => {
  console.log('Refresh token:', tokens.refresh_token);
});

