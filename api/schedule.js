import { getSheets, SPREADSHEET_ID } from './_sheets.js';

const SHEET = 'Schedules';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function getSchedule(body, res) {
  const { email } = body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

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
}

async function saveSchedule(body, res) {
  const { email, templateId, fieldData, deliveryDay, enabled } = body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const sheets = getSheets();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:A`,
  });

  const rows = existing.data.values || [];
  const rowIndex = rows.findIndex(
    (r, i) => i > 0 && r[0]?.toLowerCase().trim() === email.toLowerCase().trim()
  );

  const rowData = [
    email.toLowerCase().trim(),
    templateId || '',
    typeof fieldData === 'string' ? fieldData : JSON.stringify(fieldData || {}),
    String(deliveryDay || 1),
    enabled ? 'TRUE' : 'FALSE',
    new Date().toISOString(),
  ];

  if (rowIndex > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A${rowIndex + 1}:F${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A:F`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });
  }

  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...body } = req.body || {};

  try {
    if (action === 'get') return await getSchedule(body, res);
    if (action === 'save') return await saveSchedule(body, res);
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('schedule error:', error);
    return res.status(500).json({ error: 'Request failed', details: error.message });
  }
}
