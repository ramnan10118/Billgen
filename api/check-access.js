import { getUser, createUser } from './db/users.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let user = await getUser(email);

    if (!user) {
      user = await createUser(email);
    }

    return res.status(200).json({
      valid: true,
      tier: user.tier,
      downloadsUsed: user.downloadsUsed,
      downloadsLimit: user.downloadsLimit,
      isSubscribed: user.isSubscribed,
      subscribedUntil: user.subscribedUntil,
      daysRemaining: user.daysRemaining,
      renewalDue: user.renewalDue,
      tier3AckAccepted: user.tier3AckAccepted,
    });
  } catch (error) {
    console.error('Access check error:', error);
    return res.status(500).json({ error: 'Failed to verify access', details: error.message });
  }
}
