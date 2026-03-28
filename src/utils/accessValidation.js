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
    return {
      valid: data.valid,
      tier: data.tier,
      downloadsUsed: data.downloadsUsed,
      downloadsLimit: data.downloadsLimit,
      isSubscribed: data.isSubscribed,
      subscribedUntil: data.subscribedUntil,
      daysRemaining: data.daysRemaining,
      renewalDue: data.renewalDue,
    };
  } catch (error) {
    console.error('Access validation error:', error);
    return { valid: null, error: error.message };
  }
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
