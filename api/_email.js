import { Resend } from 'resend';

export const FROM = 'RavenLog <noreply@ravenlog.in>';
export const APP_URL = process.env.VITE_APP_URL || 'https://ravenlog.in';

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Monthly recurring delivery — one email, one link that downloads all bills as
 * a single ZIP.
 * @param {string} email
 * @param {object} opts
 * @param {string} opts.monthName
 * @param {string} opts.downloadUrl   single link to the /download page
 * @param {string[]} opts.billNames   names listed in the email body
 */
export async function sendMonthlyBillsEmail(email, { monthName, downloadUrl, billNames }) {
  const count = billNames.length;
  const list = billNames
    .map(
      (name) => `
        <li style="color:#cbd5e1;font-size:13px;line-height:1.9;list-style:none;">
          <span style="color:#06b6d4;">▸</span>&nbsp; ${name}
        </li>`
    )
    .join('');

  await getResend().emails.send({
    from: FROM,
    to: email.trim(),
    subject: `Your bills for ${monthName} are ready`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0d12;color:#e2e8f0;border-radius:8px;">
        <h2 style="color:#06b6d4;font-size:20px;margin-bottom:8px;">Monthly bills ready</h2>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;">
          Your <strong style="color:#f1f5f9;">${count}</strong> bill${count > 1 ? 's' : ''} for <strong style="color:#f1f5f9;">${monthName}</strong> ${count > 1 ? 'are' : 'is'} ready:
        </p>
        <ul style="margin:12px 0 20px;padding:0;">${list}</ul>
        <a href="${downloadUrl}" style="display:block;padding:14px 24px;background:#06b6d4;color:#000;font-weight:700;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;text-align:center;">
          Download ${count > 1 ? 'all bills' : 'bill'} &nbsp;↓
        </a>
        <p style="color:#475569;font-size:12px;margin-top:32px;">
          One click downloads a ZIP with ${count > 1 ? 'all your bills' : 'your bill'} inside.<br/>
          RavenLog · ravenlog.in
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to RΛVEN_LOG',
    html: `
      <div style="font-family:'Share Tech Mono',monospace,sans-serif;max-width:520px;margin:0 auto;padding:40px 28px;background:#0d0d12;color:#e2e8f0;">
        <p style="color:#06b6d4;font-size:11px;letter-spacing:0.2em;margin:0 0 24px;">RΛVEN_LOG // SYSTEM INIT</p>

        <h1 style="font-size:26px;font-weight:700;color:#f1f5f9;margin:0 0 8px;letter-spacing:0.05em;">Every transaction<br/>leaves a trace.</h1>

        <p style="color:#64748b;font-size:13px;margin:4px 0 32px;">Access granted. You're in.</p>

        <div style="border-left:2px solid #06b6d4;padding:12px 16px;background:#050505;margin-bottom:32px;">
          <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0;">
            You now have <strong style="color:#e2e8f0;">3 free downloads</strong> to generate expense receipts, fuel bills, and more —
            formatted for Indian tax submissions and reimbursement claims.
          </p>
        </div>

        <a href="${APP_URL}" style="display:inline-block;padding:12px 32px;background:#06b6d4;color:#000000;font-weight:700;font-size:13px;letter-spacing:0.1em;text-decoration:none;border-radius:2px;">
          OPEN RΛVEN_LOG →
        </a>

        <hr style="border:none;border-top:1px solid #1e2030;margin:40px 0 24px;" />

        <p style="color:#334155;font-size:11px;line-height:1.6;margin:0;">
          Need more than 3 downloads? Upgrade to unlimited for ₹149/month.<br/>
          Questions? Reply to this email.
        </p>
        <p style="color:#1e293b;font-size:11px;margin:16px 0 0;">RavenLog · ravenlog.in</p>
      </div>
    `,
  });
}
