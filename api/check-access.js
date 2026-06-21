import { OAuth2Client } from 'google-auth-library';
import { getOrCreateOAuthUser, getUserByGoogleId } from './db/users.js';

function userPayload(user) {
  if (user.banned) {
    return { valid: false, banned: true };
  }
  return {
    valid: true,
    email: user.email,
    googleId: user.googleId || null,
    tier: user.tier,
    downloadsUsed: user.downloadsUsed,
    downloadsLimit: user.downloadsLimit,
    isSubscribed: user.isSubscribed,
    subscribedUntil: user.subscribedUntil,
    daysRemaining: user.daysRemaining,
    renewalDue: user.renewalDue,
    tier3AckAccepted: user.tier3AckAccepted,
  };
}

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

  const { credential, googleId: bodyGoogleId } = req.body || {};

  try {
    if (credential) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: 'Server missing GOOGLE_CLIENT_ID' });
      }

      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const email = payload.email;

      if (!email) {
        return res.status(400).json({ error: 'Google account has no email' });
      }

      const user = await getOrCreateOAuthUser(googleId, email);
      return res.status(200).json(userPayload(user));
    }

    if (bodyGoogleId) {
      const user = await getUserByGoogleId(String(bodyGoogleId).trim());
      if (!user) {
        return res.status(200).json({ valid: false });
      }
      return res.status(200).json(userPayload(user));
    }

    return res.status(400).json({ error: 'credential or googleId is required' });
  } catch (error) {
    console.error('Access check error:', error);
    return res.status(500).json({ error: 'Failed to verify access', details: error.message });
  }
}
