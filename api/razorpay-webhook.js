import crypto from 'crypto';
import { findUserBySubscriptionId, updateUser } from './db/users.js';

function verifyWebhookSignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  return expectedSignature === signature;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature || !verifyWebhookSignature(req.body, signature)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { event, payload } = req.body;

  try {
    const subscriptionEntity = payload?.subscription?.entity;
    if (!subscriptionEntity?.id) {
      return res.status(200).json({ status: 'ignored', reason: 'no subscription id' });
    }

    const subscriptionId = subscriptionEntity.id;
    const user = await findUserBySubscriptionId(subscriptionId);

    if (!user) {
      console.warn(`Webhook: no user found for subscription ${subscriptionId}`);
      return res.status(200).json({ status: 'ignored', reason: 'user not found' });
    }

    switch (event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await updateUser(user.email, { subscribedUntil: expiry.toISOString() });
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.halted': {
        await updateUser(user.email, { subscribedUntil: '' });
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
