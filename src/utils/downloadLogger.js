// Log downloads to Google Sheets via backend API
// Fire-and-forget — doesn't block the download

const API_URL = import.meta.env.VITE_API_URL || '';

export const logDownload = async (email, template, format) => {
  try {
    await fetch(`${API_URL}/api/log-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, template, format }),
    });
  } catch (error) {
    console.error('Failed to log download:', error);
  }
};
