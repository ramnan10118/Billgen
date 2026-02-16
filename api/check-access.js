import { getSheets, SPREADSHEET_ID } from './_sheets.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:A',
    });

    const values = response.data.values || [];
    const approvedEmails = values
      .flat()
      .map(e => e?.toLowerCase().trim())
      .filter(Boolean);

    const normalizedEmail = email.toLowerCase().trim();
    const isValid = approvedEmails.includes(normalizedEmail);

    return res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error('Access check error:', error);
    return res.status(500).json({ error: 'Failed to verify access', details: error.message });
  }
}
