import crypto from 'crypto';
import Razorpay from 'razorpay';
import { updateUser } from './db/users.js';
import { getResend, FROM, APP_URL } from './_email.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function createOrder(body, res) {
  const { email } = body || {};
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const order = await razorpay.orders.create({
    amount: 14900,
    currency: 'INR',
    receipt: `rl_${Date.now()}`,
    notes: { email: email.toLowerCase().trim() },
  });

  return res.status(200).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}

async function verifyOrder(body, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid signature', verified: false });
  }

  const subscribedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await updateUser(email, { subscribedUntil });

  const expiryDisplay = new Date(subscribedUntil).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Payment confirmed — RavenLog access activated',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0d12;color:#e2e8f0;border-radius:8px;">
        <h2 style="color:#06b6d4;font-size:20px;margin-bottom:8px;">Payment confirmed ✓</h2>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;">Your RavenLog subscription is now active.</p>
        <div style="margin:24px 0;padding:16px 20px;background:#1e2029;border-left:3px solid #06b6d4;">
          <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Amount paid</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:#f1f5f9;">₹149</p>
          <p style="margin:8px 0 0;color:#64748b;font-size:12px;">Valid until ${expiryDisplay}</p>
        </div>
        <a href="${APP_URL}" style="display:inline-block;padding:12px 28px;background:#06b6d4;color:#000;font-weight:700;text-decoration:none;border-radius:4px;font-size:14px;letter-spacing:0.05em;">
          START GENERATING →
        </a>
        <p style="color:#475569;font-size:12px;margin-top:32px;">RavenLog · ravenlog.in</p>
      </div>
    `,
  }).catch((err) => console.error('Confirmation email error:', err));

  return res.status(200).json({ verified: true, subscribedUntil });
}

async function verifyPayment(body, res) {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body || {};

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex');

  return res.status(200).json({ verified: generatedSignature === razorpay_signature });
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, ...body } = req.body || {};

  try {
    if (action === 'create-order') return await createOrder(body, res);
    if (action === 'verify-order') return await verifyOrder(body, res);
    if (action === 'verify-payment') return await verifyPayment(body, res);
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('payments error:', error);
    return res.status(500).json({ error: 'Request failed', details: error.message });
  }
}
