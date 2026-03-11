import { getSheets, SPREADSHEET_ID } from './_sheets.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, suggestion } = req.body;

  if (!suggestion) {
    return res.status(400).json({ error: 'suggestion is required' });
  }

  try {
    const sheets = getSheets();
    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Suggestions!A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[email || 'anonymous', suggestion, timestamp]],
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Suggestion submit error:', error);
    return res.status(500).json({ error: 'Failed to submit suggestion', details: error.message });
  }
}
