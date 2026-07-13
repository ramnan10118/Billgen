import { getSheets, SPREADSHEET_ID } from '../_sheets.js';
import { sendMonthlyBillsEmail, APP_URL } from '../_email.js';
import { checkSubscription } from '../db/users.js';
import { TEMPLATES } from '../../src/templates/templateConfig.js';
import { generateMonthlyBills, billDateRange } from '../../src/utils/recurringBill.js';

const SHEET = 'Schedules';

// Row layout (A:G): A email | B templatesCsv | C config JSON [{templateId, fields, total, splits}]
//                   D deliveryDay | E enabled | F updatedAt | G frequency
function parseConfig(templatesCsv, config) {
  try {
    const parsed = JSON.parse(config || '[]');
    if (Array.isArray(parsed)) {
      return parsed.map((t) => ({
        templateId: t.templateId,
        fields: t.fields || t.fieldData || {},
        total: Number(t.total) || 0,
        splits: Math.max(1, parseInt(t.splits, 10) || 1),
      }));
    }
    if (parsed && typeof parsed === 'object' && templatesCsv) {
      // Legacy single-template row.
      return [{ templateId: templatesCsv, fields: parsed, total: 0, splits: 1 }];
    }
  } catch { /* malformed */ }
  return [];
}

// A bimonthly schedule fires only on even calendar months (Feb, Apr, …) so it
// lands once every two months on a fixed cadence without needing stored state.
function shouldRunThisMonth(frequency, now) {
  if (frequency === 'bimonthly') return now.getMonth() % 2 === 1;
  return true; // once + monthly run whenever the delivery day matches
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel cron injects `Authorization: Bearer ${CRON_SECRET}`. Reject anyone else.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A:G`,
    });

    const rows = response.data.values || [];
    const now = new Date();
    const todayDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    // Test escape hatch: SKIP_SUBSCRIPTION_GATE=true delivers to everyone.
    const bypassSub = process.env.SKIP_SUBSCRIPTION_GATE === 'true';
    const sent = [];
    const skipped = [];
    const disableRows = []; // one-time schedules to switch off after sending

    for (let i = 1; i < rows.length; i++) {
      const [email, templatesCsv, config, deliveryDay, enabled, , frequencyCol] = rows[i];
      if (!email || String(enabled).toUpperCase() !== 'TRUE') continue;
      const frequency = frequencyCol || 'monthly';
      // Clamp the requested day to the last day of this month, so 29/30/31 still
      // fire in short months (e.g. day 31 → Feb 28).
      const wantDay = Math.min(parseInt(deliveryDay, 10) || 1, daysInMonth);
      if (wantDay !== todayDay) continue;
      if (!shouldRunThisMonth(frequency, now)) {
        skipped.push({ email, reason: 'off_cycle' });
        continue;
      }

      // Paid-to-activate: configured by anyone, only delivered to subscribers.
      if (!bypassSub) {
        const sub = await checkSubscription(email.trim());
        if (!sub.valid || !sub.isSubscribed) {
          skipped.push({ email, reason: 'not_subscribed' });
          continue;
        }
      }

      const templates = parseConfig(templatesCsv, config);
      if (templates.length === 0) continue;

      // Bills are dated on weekdays inside the billing cycle (delivery day last
      // cycle → delivery day now). Each template splits its own total.
      const { start, end } = billDateRange(frequency, wantDay, now);
      const generated = [];
      for (const { templateId, fields, total, splits } of templates) {
        const bills = generateMonthlyBills(templateId, fields, {
          monthlyTarget: total,
          splitCount: splits,
          rangeStart: start,
          rangeEnd: end,
          now,
        });
        for (const bill of bills) generated.push({ templateId, fields: bill });
      }
      if (generated.length === 0) continue;

      // Single download link: all bills packed into one base64url token. The
      // /download page renders them and hands back a ZIP. base64url keeps the
      // payload URL-safe ('+' would otherwise decode as a space).
      const token = Buffer.from(JSON.stringify(generated)).toString('base64url');
      const downloadUrl = `${APP_URL}/download?data=${token}&month=${encodeURIComponent(monthName)}`;
      const billNames = generated.map((g) => TEMPLATES[g.templateId]?.name || g.templateId);

      await sendMonthlyBillsEmail(email, { monthName, downloadUrl, billNames });
      sent.push({ email, count: generated.length });

      // A one-time schedule delivers once, then switches itself off.
      if (frequency === 'once') disableRows.push(i);
    }

    // Flip enabled -> FALSE for delivered one-time schedules (col E).
    for (const i of disableRows) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET}!E${i + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['FALSE']] },
      });
    }

    return res.status(200).json({ ok: true, sent, skipped });
  } catch (error) {
    console.error('monthly-delivery cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
