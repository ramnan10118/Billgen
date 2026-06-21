const API_URL = import.meta.env.VITE_API_URL || '';

function mapAccessData(data) {
  return {
    valid: data.valid,
    email: data.email,
    googleId: data.googleId ?? null,
    tier: data.tier,
    downloadsUsed: data.downloadsUsed,
    downloadsLimit: data.downloadsLimit,
    isSubscribed: data.isSubscribed,
    subscribedUntil: data.subscribedUntil,
    daysRemaining: data.daysRemaining,
    renewalDue: data.renewalDue,
    tier3AckAccepted: data.tier3AckAccepted ?? false,
  };
}

/** Sign-in: verify Google ID token with backend */
export const validateGoogleCredential = async (credential) => {
  try {
    const response = await fetch(`${API_URL}/api/check-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.banned) return { valid: false, banned: true };
    if (data.valid !== true) {
      return { valid: false, error: data.error || 'Access denied' };
    }
    return { valid: true, ...mapAccessData(data) };
  } catch (error) {
    console.error('Access validation error:', error);
    return { valid: null, error: error.message };
  }
};

/** Session refresh: lookup by Google subject id (sheet column H) */
export const validateSessionByGoogleId = async (googleId) => {
  try {
    const response = await fetch(`${API_URL}/api/check-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.banned) return { valid: false, banned: true };
    if (data.valid !== true) {
      return { valid: false, error: data.error || 'Session expired' };
    }
    return { valid: true, ...mapAccessData(data) };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: null, error: error.message };
  }
};
