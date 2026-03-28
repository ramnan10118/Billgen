const API_URL = import.meta.env.VITE_API_URL || '';

export const logDownload = async (email, template, format) => {
  try {
    const res = await fetch(`${API_URL}/api/log-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, template, format }),
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to log download:', error);
    return null;
  }
};
