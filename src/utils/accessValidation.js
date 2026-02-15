// Google Sheets API validation for access control
// The sheet should have a single column with approved email addresses

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SHEET_RANGE = import.meta.env.VITE_SHEET_RANGE || 'Sheet1!A:A';

export const validateEmailAccess = async (email) => {
  if (!SHEET_ID || !API_KEY) {
    console.warn('Google Sheets credentials not configured. Running in dev mode - all emails accepted.');
    // In dev mode without credentials, accept all emails
    return { valid: true, devMode: true };
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const values = data.values || [];
    
    // Flatten the array and normalize emails
    const approvedEmails = values
      .flat()
      .map(e => e?.toLowerCase().trim())
      .filter(Boolean);

    const normalizedEmail = email.toLowerCase().trim();
    const isValid = approvedEmails.includes(normalizedEmail);

    return { valid: isValid, devMode: false };
  } catch (error) {
    console.error('Access validation error:', error);
    // Return error state - caller should handle grace period logic
    return { valid: null, error: error.message, devMode: false };
  }
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
