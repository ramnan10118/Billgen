// Access validation via backend API
// Backend verifies email against Google Sheet using service account

const API_URL = import.meta.env.VITE_API_URL || '';

export const validateEmailAccess = async (email) => {
  try {
    const response = await fetch(`${API_URL}/api/check-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { valid: data.valid, devMode: false };
  } catch (error) {
    console.error('Access validation error:', error);
    return { valid: null, error: error.message, devMode: false };
  }
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
