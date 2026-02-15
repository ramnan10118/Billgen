// Date helper utilities for bill generation

export const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getMonthName = (monthIndex) => months[monthIndex];

export const getCurrentMonth = () => {
  const now = new Date();
  return {
    month: months[now.getMonth()],
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
  };
};

export const getLastMonth = () => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return {
    month: months[now.getMonth()],
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
  };
};

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD MMM YYYY':
      return `${day} ${months[d.getMonth()].slice(0, 3)} ${year}`;
    case 'MMMM YYYY':
      return `${months[d.getMonth()]} ${year}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

export const getBillingPeriod = (type = 'current') => {
  const { month, year } = type === 'current' ? getCurrentMonth() : getLastMonth();
  return `${month} ${year}`;
};

export const getDatePresets = () => {
  const today = new Date();
  const currentMonth = getCurrentMonth();
  const lastMonth = getLastMonth();
  
  // First day of current month
  const firstDayCurrent = new Date(today.getFullYear(), today.getMonth(), 1);
  // Last day of current month
  const lastDayCurrent = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  // First day of last month
  const firstDayLast = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  // Last day of last month
  const lastDayLast = new Date(today.getFullYear(), today.getMonth(), 0);
  
  return {
    today: formatDate(today),
    currentMonth: {
      label: `${currentMonth.month}`,
      period: `${formatDate(firstDayCurrent)} - ${formatDate(lastDayCurrent)}`,
      start: formatDate(firstDayCurrent),
      end: formatDate(lastDayCurrent),
    },
    lastMonth: {
      label: `${lastMonth.month}`,
      period: `${formatDate(firstDayLast)} - ${formatDate(lastDayLast)}`,
      start: formatDate(firstDayLast),
      end: formatDate(lastDayLast),
    },
    // Due date is typically 15-20 days from bill date
    defaultDueDate: formatDate(new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)),
  };
};

export const generateBillNumber = (prefix = 'INV') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generateAccountNumber = () => {
  return Math.random().toString().slice(2, 14);
};

// Generate Playo-style booking ID (6 uppercase letters)
export const generatePlayoId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate Shell-style transaction ID
export const generateShellTxnId = () => {
  const part1 = '2';
  const part2 = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  const part3 = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
  const part4 = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${part1}_${part2}_${part3}_${part4}`;
};

// Generate Airtel receipt number (18 digits)
export const generateAirtelReceiptNo = () => {
  let result = '73';
  for (let i = 0; i < 16; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
};

// Generate Airtel order number (18 digits)
export const generateAirtelOrderNo = () => {
  let result = '73';
  for (let i = 0; i < 16; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
};

// Generate PhonePe transaction ID (12 digits)
export const generatePhonePeTxnId = () => {
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
};

// Generate UTR number (alphanumeric like TRa8Djsl90Fdbq)
export const generateUtrNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'TR';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
