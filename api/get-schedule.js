import { getSheets, SPREADSHEET_ID } from './_sheets.js';

const SHEET = 'Schedules';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A:F`,
    });

    const rows = response.data.values || [];
    const normalized = email.toLowerCase().trim();

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0]?.toLowerCase().trim() === normalized) {
        const [, templateId, fieldData, deliveryDay, enabled] = rows[i];
        let parsed = {};
        try { parsed = JSON.parse(fieldData || '{}'); } catch { /* malformed JSON */ }
        return res.status(200).json({
          found: true,
          templateId: templateId || '',
          fieldData: parsed,
          deliveryDay: parseInt(deliveryDay || '1', 10),
          enabled: String(enabled).toUpperCase() === 'TRUE',
        });
      }
    }

    return res.status(200).json({ found: false });
  } catch (error) {
    console.error('get-schedule error:', error);
    return res.status(500).json({ error: 'Failed to get schedule' });
  }
}
