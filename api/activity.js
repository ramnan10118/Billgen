import { logDownload, incrementDownloads, updateUser } from './db/users.js';
import { getSheets, SPREADSHEET_ID } from './_sheets.js';

const ACK_TAB = 'Acknowledgments';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) return xf.split(',')[0].trim();
  if (Array.isArray(xf) && xf[0]) return xf[0].trim();
  return req.socket?.remoteAddress || '';
}

async function ensureAcknowledgmentsTab(sheets) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties.title',
  });
  const titles = (meta.data.sheets || []).map((s) => s.properties?.title);
  if (titles.includes(ACK_TAB)) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: ACK_TAB } } }] },
  });
}

async function handleLogDownload(body, res) {
  const { email, template, format } = body || {};
  if (!email || !template || !format) {
    return res.status(400).json({ error: 'email, template, and format are required' });
  }
  await logDownload({ email, template, format });
  const result = await incrementDownloads(email);
  return res.status(200).json({ success: true, ...result });
}

async function handleLogAcknowledgment(body, req, res) {
  const { email, templateId, timestamp } = body || {};
  if (!email || !templateId || !timestamp) {
    return res.status(200).json({ success: false });
  }

  const userRow = await updateUser(email, { tier3AckAccepted: true });
  if (!userRow) return res.status(200).json({ success: false });

  const sheets = getSheets();
  await ensureAcknowledgmentsTab(sheets);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ACK_TAB}!A:D`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[email, templateId, timestamp, getClientIp(req)]] },
  });

  return res.status(200).json({ success: true });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...body } = req.body || {};

  try {
    if (action === 'log-download') return await handleLogDownload(body, res);
    if (action === 'log-acknowledgment') return await handleLogAcknowledgment(body, req, res);
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('activity error:', error);
    return res.status(500).json({ error: 'Request failed', details: error.message });
  }
}
