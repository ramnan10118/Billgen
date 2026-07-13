import { getSheets, SPREADSHEET_ID } from './_sheets.js';

const SHEET = 'Schedules';

// Row layout (A:G):
//   A email | B templatesCsv (readable) | C config JSON [{templateId, fields, total, splits}]
//   D deliveryDay | E enabled | F updatedAt | G frequency (once|monthly|bimonthly)
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parse column C into the [{templateId, fieldData, total, splits}] shape,
// tolerating the older single-template format (B = templateId, C = a fields obj).
function parseTemplates(templateIdCol, configCol) {
  try {
    const parsed = JSON.parse(configCol || '[]');
    if (Array.isArray(parsed)) {
      return parsed.map((t) => ({
        templateId: t.templateId,
        fieldData: t.fields || t.fieldData || {},
        total: Number(t.total) || 0,
        splits: Math.max(1, parseInt(t.splits, 10) || 1),
      }));
    }
    // Legacy: C held a plain fields object for a single template in column B.
    if (parsed && typeof parsed === 'object' && templateIdCol) {
      return [{ templateId: templateIdCol, fieldData: parsed, total: 0, splits: 1 }];
    }
  } catch { /* malformed */ }
  return [];
}

async function getSchedule(body, res) {
  const { email } = body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  const sheets = getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET}!A:G`,
  });

  const rows = response.data.values || [];
  const normalized = email.toLowerCase().trim();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.toLowerCase().trim() === normalized) {
      const [, templatesCsv, config, deliveryDay, enabled, , frequency] = rows[i];
      return res.status(200).json({
        found: true,
        templates: parseTemplates(templatesCsv, config),
        deliveryDay: parseInt(deliveryDay || '1', 10),
        enabled: String(enabled).toUpperCase() === 'TRUE',
        frequency: frequency || 'monthly',
      });
    }
  }

  return res.status(200).json({ found: false });
}

async function saveSchedule(body, res) {
  const { email, templates, deliveryDay, enabled, frequency } = body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Normalize incoming templates to [{ templateId, fields, total, splits }].
  const list = Array.isArray(templates)
    ? templates
        .filter((t) => t && t.templateId)
        .map((t) => ({
          templateId: t.templateId,
          fields: t.fieldData || t.fields || {},
          total: Number(t.total) || 0,
          splits: Math.max(1, parseInt(t.splits, 10) || 1),
        }))
    : [];

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
    list.map((t) => t.templateId).join(','),
    JSON.stringify(list),
    String(deliveryDay || 1),
    enabled ? 'TRUE' : 'FALSE',
    new Date().toISOString(),
    frequency || 'monthly',
  ];

  if (rowIndex > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A${rowIndex + 1}:G${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A:G`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowData] },
    });
  }

  return res.status(200).json({ ok: true });
}

// Remove a user's schedule row entirely so they can start from scratch.
async function deleteSchedule(body, res) {
  const { email } = body || {};
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
  if (rowIndex <= 0) return res.status(200).json({ ok: true, deleted: false });

  // deleteDimension needs the tab's numeric sheetId.
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const tab = meta.data.sheets.find((s) => s.properties.title === SHEET);
  if (!tab) return res.status(500).json({ error: 'Schedules tab missing' });

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: tab.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex, // 0-based; row 0 is the header
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });

  return res.status(200).json({ ok: true, deleted: true });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...body } = req.body || {};

  try {
    if (action === 'get') return await getSchedule(body, res);
    if (action === 'save') return await saveSchedule(body, res);
    if (action === 'delete') return await deleteSchedule(body, res);
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('schedule error:', error);
    return res.status(500).json({ error: 'Request failed', details: error.message });
  }
}
