import { getSheets, SPREADSHEET_ID } from '../_sheets.js';
import { resend, FROM, APP_URL } from '../_email.js';
import { TEMPLATES } from '../../src/templates/templateConfig.js';

const SHEET = 'Schedules';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!A:F`,
    });

    const rows = response.data.values || [];
    const todayDay = new Date().getDate();
    const monthName = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const sent = [];

    for (let i = 1; i < rows.length; i++) {
      const [email, templateId, fieldData, deliveryDay, enabled] = rows[i];
      if (!email || String(enabled).toUpperCase() !== 'TRUE') continue;
      if (parseInt(deliveryDay, 10) !== todayDay) continue;

      let fields = {};
      try { fields = JSON.parse(fieldData || '{}'); } catch { /* skip bad JSON */ }

      const template = TEMPLATES[templateId];
      const templateName = template?.name || templateId;

      const encoded = Buffer.from(JSON.stringify(fields)).toString('base64');
      const magicLink = `${APP_URL}/generate/${templateId}?data=${encoded}`;

      await resend.emails.send({
        from: FROM,
        to: email.trim(),
        subject: `Your ${templateName} for ${monthName} is ready`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0d12;color:#e2e8f0;border-radius:8px;">
            <h2 style="color:#06b6d4;font-size:20px;margin-bottom:8px;">Monthly bill ready</h2>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;">
              Your <strong style="color:#f1f5f9;">${templateName}</strong> for <strong style="color:#f1f5f9;">${monthName}</strong> is pre-filled and ready to download.
            </p>
            <a href="${magicLink}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#06b6d4;color:#000;font-weight:700;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">
              OPEN &amp; DOWNLOAD →
            </a>
            <p style="color:#475569;font-size:12px;margin-top:32px;">
              This link opens RavenLog with your saved details pre-filled.<br/>
              RavenLog · ravenlog.in
            </p>
          </div>
        `,
      });
      sent.push({ email, templateId });
    }

    return res.status(200).json({ ok: true, sent });
  } catch (error) {
    console.error('monthly-delivery cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
