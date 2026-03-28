import { getSheets, SPREADSHEET_ID } from '../_sheets.js';

const DATA_SOURCE = process.env.DATA_SOURCE || 'sheets';
const SHEET_NAME = 'Sheet1';
const FREE_DOWNLOAD_LIMIT = 3;

const COL = {
  EMAIL: 0,
  DOWNLOADS_USED: 1,
  TIER: 2,
  RAZORPAY_SUB_ID: 3,
  SUBSCRIBED_UNTIL: 4,
  CREATED_AT: 5,
  TIER3_ACK: 6,
};

function parseTier3Ack(raw) {
  if (raw === undefined || raw === null || raw === '') return false;
  const v = String(raw).trim().toUpperCase();
  return v === 'TRUE' || v === '1' || v === 'YES';
}

function parseRow(row) {
  if (!row) return null;
  const subscribedUntil = row[COL.SUBSCRIBED_UNTIL] || null;
  let isSubscribed = false;
  let daysRemaining = null;
  let renewalDue = false;

  if (subscribedUntil) {
    const diffMs = new Date(subscribedUntil).getTime() - Date.now();
    daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    isSubscribed = daysRemaining > 0;
    renewalDue = isSubscribed && daysRemaining <= 5;
  }

  return {
    email: row[COL.EMAIL] || '',
    downloadsUsed: parseInt(row[COL.DOWNLOADS_USED] || '0', 10),
    tier: parseInt(row[COL.TIER] || '1', 10),
    razorpaySubId: row[COL.RAZORPAY_SUB_ID] || null,
    subscribedUntil,
    createdAt: row[COL.CREATED_AT] || null,
    isSubscribed,
    daysRemaining: isSubscribed ? daysRemaining : 0,
    renewalDue,
    downloadsLimit: FREE_DOWNLOAD_LIMIT,
    tier3AckAccepted: parseTier3Ack(row[COL.TIER3_ACK]),
  };
}

async function getAllRows(sheets) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });
  return response.data.values || [];
}

async function findUserRow(sheets, email) {
  const rows = await getAllRows(sheets);
  const normalized = email.toLowerCase().trim();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COL.EMAIL]?.toLowerCase().trim() === normalized) {
      return { rowIndex: i, row: rows[i] };
    }
  }
  return null;
}

// --- Public API ---

export async function getUser(email) {
  if (DATA_SOURCE === 'supabase') throw new Error('Supabase not implemented');

  const sheets = getSheets();
  const result = await findUserRow(sheets, email);
  if (!result) return null;
  return { ...parseRow(result.row), _rowIndex: result.rowIndex };
}

export async function createUser(email) {
  if (DATA_SOURCE === 'supabase') throw new Error('Supabase not implemented');

  const sheets = getSheets();
  const normalized = email.toLowerCase().trim();
  const now = new Date().toISOString();
  const newRow = [normalized, '0', '1', '', '', now, 'FALSE'];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [newRow] },
  });

  return parseRow(newRow);
}

export async function updateUser(email, fields) {
  if (DATA_SOURCE === 'supabase') throw new Error('Supabase not implemented');

  const sheets = getSheets();
  const result = await findUserRow(sheets, email);
  if (!result) return null;

  const { rowIndex, row } = result;
  const updates = [];

  if (fields.downloadsUsed !== undefined) {
    updates.push({
      range: `${SHEET_NAME}!B${rowIndex + 1}`,
      values: [[String(fields.downloadsUsed)]],
    });
  }
  if (fields.tier !== undefined) {
    updates.push({
      range: `${SHEET_NAME}!C${rowIndex + 1}`,
      values: [[String(fields.tier)]],
    });
  }
  if (fields.razorpaySubId !== undefined) {
    updates.push({
      range: `${SHEET_NAME}!D${rowIndex + 1}`,
      values: [[fields.razorpaySubId]],
    });
  }
  if (fields.subscribedUntil !== undefined) {
    updates.push({
      range: `${SHEET_NAME}!E${rowIndex + 1}`,
      values: [[fields.subscribedUntil]],
    });
  }
  if (fields.tier3AckAccepted !== undefined) {
    updates.push({
      range: `${SHEET_NAME}!G${rowIndex + 1}`,
      values: [[fields.tier3AckAccepted ? 'TRUE' : 'FALSE']],
    });
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });
  }

  const updatedResult = await findUserRow(sheets, email);
  return updatedResult ? parseRow(updatedResult.row) : null;
}

export async function incrementDownloads(email) {
  if (DATA_SOURCE === 'supabase') throw new Error('Supabase not implemented');

  const sheets = getSheets();
  const result = await findUserRow(sheets, email);
  if (!result) return { downloadsUsed: 0, downloadsLimit: FREE_DOWNLOAD_LIMIT };

  const { rowIndex, row } = result;
  const current = parseInt(row[COL.DOWNLOADS_USED] || '0', 10);
  const newCount = current + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[newCount]] },
  });

  const subscribedUntil = row[COL.SUBSCRIBED_UNTIL] || null;
  const isSubscribed = subscribedUntil ? new Date(subscribedUntil).getTime() > Date.now() : false;

  return {
    downloadsUsed: newCount,
    downloadsLimit: FREE_DOWNLOAD_LIMIT,
    requiresSubscription: newCount >= FREE_DOWNLOAD_LIMIT && !isSubscribed,
  };
}

export async function checkSubscription(email) {
  if (DATA_SOURCE === 'supabase') throw new Error('Supabase not implemented');

  const user = await getUser(email);
  if (!user) return { valid: false };

  return {
    valid: true,
    isSubscribed: user.isSubscribed,
    subscribedUntil: user.subscribedUntil,
    daysRemaining: user.daysRemaining,
    renewalDue: user.renewalDue,
    tier: user.tier,
  };
}

export async function findUserBySubscriptionId(subscriptionId) {
  if (DATA_SOURCE === 'supabase') throw new Error('Supabase not implemented');

  const sheets = getSheets();
  const rows = await getAllRows(sheets);

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COL.RAZORPAY_SUB_ID] === subscriptionId) {
      return { ...parseRow(rows[i]), _rowIndex: i };
    }
  }
  return null;
}

export async function logAccessRequest(data) {
  if (DATA_SOURCE === 'supabase') throw new Error('Supabase not implemented');

  const sheets = getSheets();
  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Requests!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[data.email, data.reason || '', timestamp]],
    },
  });
}

export async function logDownload(data) {
  if (DATA_SOURCE === 'supabase') throw new Error('Supabase not implemented');

  const sheets = getSheets();
  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Downloads!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[data.email, data.template, data.format, timestamp]],
    },
  });
}
