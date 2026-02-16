import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const getAuth = () => {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

export const getSheets = () => {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
};

export const SPREADSHEET_ID = SHEET_ID;
