import { logAccessRequest } from './db/users.js';

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

  const { email, reason } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    await logAccessRequest({ email, reason });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Request access error:', error);
    return res.status(500).json({ error: 'Failed to submit request', details: error.message });
  }
}
