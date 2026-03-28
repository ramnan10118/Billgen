import { getSheets, SPREADSHEET_ID } from './_sheets.js';
import { updateUser } from './db/users.js';

const TAB_TITLE = 'Acknowledgments';

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) {
    return xf.split(',')[0].trim();
  }
  if (Array.isArray(xf) && xf[0]) return xf[0].trim();
  return req.socket?.remoteAddress || '';
}

async function ensureAcknowledgmentsTab(sheets) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });
  const titles = (meta.data.sheets || []).map((s) => s.properties?.title);
  if (titles.includes(TAB_TITLE)) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{ addSheet: { properties: { title: TAB_TITLE } } }],
    },
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ success: false });
  }

  const { email, templateId, timestamp } = req.body || {};
  if (!email || !templateId || !timestamp) {
    return res.status(200).json({ success: false });
  }

  try {
    const userRow = await updateUser(email, { tier3AckAccepted: true });
    if (!userRow) {
      return res.status(200).json({ success: false });
    }

    const sheets = getSheets();
    await ensureAcknowledgmentsTab(sheets);

    const ip = getClientIp(req);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB_TITLE}!A:D`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[email, templateId, timestamp, ip]],
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('log-acknowledgment error:', error);
    return res.status(200).json({ success: false });
  }
}
