import { getSheets, SPREADSHEET_ID } from '../_sheets.js';
import { getResend, FROM, APP_URL } from '../_email.js';

export default async function handler(req, res) {
  // Vercel cron calls with GET; allow POST for manual testing
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:I',
    });

    const rows = response.data.values || [];
    const now = Date.now();
    const sent = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const email = row[0]?.trim();
      const subscribedUntil = row[4] || null;
      const banned = String(row[8] || '').toUpperCase() === 'TRUE';

      if (!email || !subscribedUntil || banned) continue;

      const diffMs = new Date(subscribedUntil).getTime() - now;
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining > 0 && daysRemaining <= 5) {
        await getResend().emails.send({
          from: FROM,
          to: email,
          subject: `Your RavenLog subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0d12;color:#e2e8f0;border-radius:8px;">
              <h2 style="color:#06b6d4;font-size:20px;margin-bottom:8px;">Subscription expiring soon</h2>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;">
                Your RavenLog subscription expires in <strong style="color:#f1f5f9;">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>.
                Renew now to keep generating bills without interruption.
              </p>
              <a href="${APP_URL}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#06b6d4;color:#000;font-weight:700;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">
                RENEW NOW — ₹149
              </a>
              <p style="color:#475569;font-size:12px;margin-top:32px;">RavenLog · ravenlog.in</p>
            </div>
          `,
        });
        sent.push(email);
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (error) {
    console.error('reminders cron error:', error);
    return res.status(500).json({ error: error.message });
  }
}
