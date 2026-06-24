import { getSheets, SPREADSHEET_ID } from './_sheets.js';

const SHEET = 'Schedules';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, templateId, fieldData, deliveryDay, enabled } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const sheets = getSheets();

    // Read existing rows to find and delete current entry for this email
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A:A`,
    });

    const rows = existing.data.values || [];
    const rowIndex = rows.findIndex(
      (r, i) => i > 0 && r[0]?.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (rowIndex > 0) {
      // Clear the row (Sheets API doesn't have a true delete on Hobby — overwrite instead)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET}!A${rowIndex + 1}:F${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            email.toLowerCase().trim(),
            templateId || '',
            typeof fieldData === 'string' ? fieldData : JSON.stringify(fieldData || {}),
            String(deliveryDay || 1),
            enabled ? 'TRUE' : 'FALSE',
            new Date().toISOString(),
          ]],
        },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET}!A:F`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            email.toLowerCase().trim(),
            templateId || '',
            typeof fieldData === 'string' ? fieldData : JSON.stringify(fieldData || {}),
            String(deliveryDay || 1),
            enabled ? 'TRUE' : 'FALSE',
            new Date().toISOString(),
          ]],
        },
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('save-schedule error:', error);
    return res.status(500).json({ error: 'Failed to save schedule' });
  }
}
