import { logDownload, incrementDownloads } from './db/users.js';

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

  const { email, template, format } = req.body;

  if (!email || !template || !format) {
    return res.status(400).json({ error: 'email, template, and format are required' });
  }

  try {
    await logDownload({ email, template, format });
    const result = await incrementDownloads(email);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Download log error:', error);
    return res.status(500).json({ error: 'Failed to log download', details: error.message });
  }
}
