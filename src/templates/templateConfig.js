// Template configurations - defines fields and metadata for each bill type

export const TEMPLATES = {
  driver: {
    id: 'driver',
    name: 'Driver Salary Receipt',
    icon: '🚗',
    description: 'Driver salary declaration & receipt',
    color: '#374151',
    fields: [
      { id: 'driverName', label: 'Driver/Recipient Name', type: 'text', profileKey: 'driverName' },
      { id: 'salaryAmount', label: 'Amount (₹)', type: 'currency', default: '25000' },
      { id: 'employeeName', label: 'Employee Name (You)', type: 'text', profileKey: 'fullName' },
      { id: 'month', label: 'For Month', type: 'period' },
      { id: 'receiptDate', label: 'Receipt Date', type: 'date' },
      { id: 'vehicleNumber', label: 'Vehicle Number', type: 'text', profileKey: 'vehicleNumber' },
      { id: 'showSignature', label: 'Show Signature Line', type: 'toggle', default: true },
    ],
  },

  /** Tier 3+ only — see getAllTemplates / Generator gate */
  upi: {
    id: 'upi',
    name: 'UPI Payment Receipt',
    icon: '📱',
    description: 'UPI-style payment confirmation',
    color: '#2E7D32',
    minimumTier: 3,
    fields: [
      { id: 'driverName', label: 'Driver/Recipient Name', type: 'text', profileKey: 'driverName' },
      { id: 'salaryAmount', label: 'Amount (₹)', type: 'currency', default: '25000' },
      { id: 'recipientPhone', label: 'Recipient Phone', type: 'text', default: '+919176657929' },
      { id: 'transactionId', label: 'Transaction ID', type: 'text', autoGenerate: 'phonePeTxnId' },
      { id: 'utr', label: 'UTR Number', type: 'text', autoGenerate: 'utrNumber' },
      { id: 'bankAccount', label: 'Bank Account (masked)', type: 'text', default: 'XXXXXX8331' },
      { id: 'bankName', label: 'Bank Name', type: 'text', default: 'ICICI' },
      { id: 'paymentDateTime', label: 'Payment Date & Time', type: 'text', default: '10:12 am on 10 Apr 2025' },
    ],
  },

  playo: {
    id: 'playo',
    name: 'Sports Bill',
    icon: '⚽',
    description: 'Booking confirmation',
    color: '#10B981',
    fields: [
      { id: 'customerName', label: 'Your Name', type: 'text', profileKey: 'fullName' },
      { id: 'sportType', label: 'Sport', type: 'select', options: ['Football', 'Badminton', 'Tennis', 'Cricket', 'Basketball', 'Swimming'] },
      { id: 'venueName', label: 'Venue Name', type: 'text', default: 'Stamford Bridge' },
      { id: 'venueCity', label: 'City', type: 'text', default: 'Bengaluru' },
      { id: 'bookingId', label: 'Booking ID', type: 'text', autoGenerate: 'playoId' },
      { id: 'court', label: 'Court/Turf', type: 'text', default: '7 a side Turf-1' },
      { id: 'slotTime', label: 'Slot Time', type: 'text', default: '8:00 PM - 9:00 PM' },
      { id: 'slotDate', label: 'Slot Date', type: 'date' },
      { id: 'courtPrice', label: 'Court Price (₹)', type: 'currency', default: '2456.64' },
      { id: 'convenienceFee', label: 'Convenience Fee (₹)', type: 'currency', default: '56.64' },
      { id: 'discount', label: 'Discount (₹)', type: 'currency', default: '0' },
      { id: 'advancePaid', label: 'Advance Paid (₹)', type: 'currency' },
      { id: 'bookingDate', label: 'Booked On (Date)', type: 'date' },
      { id: 'bookingTime', label: 'Booked On (Time)', type: 'text', default: '18:25 PM' },
    ],
  },

  petrol: {
    id: 'petrol',
    name: 'Petrol Bill',
    icon: '⛽',
    description: 'Fuel station receipt',
    color: '#FBBF24',
    fields: [
      { id: 'transactionDate', label: 'Transaction Date', type: 'date' },
      { id: 'transactionTime', label: 'Transaction Time', type: 'text', default: '12:32' },
      { id: 'location', label: 'Location', type: 'text', default: 'HSR LAYOUT' },
      { id: 'transactionId', label: 'Transaction ID', type: 'text', autoGenerate: 'shellTxnId' },
      { id: 'fuelCode', label: 'Fuel Code', type: 'text', default: '02' },
      { id: 'fuelType', label: 'Fuel Type', type: 'select', options: ['V-PowerUNL', 'FuelSave UNL', 'FuelSave Diesel', 'V-Power Diesel'] },
      { id: 'quantity', label: 'Quantity (Litres)', type: 'number', default: '42' },
      { id: 'ratePerLitre', label: 'Rate per Litre (₹)', type: 'currency', default: '129.39' },
      { id: 'discount', label: 'Discount (₹)', type: 'currency', default: '150' },
      { id: 'discountText', label: 'Discount Description', type: 'text', default: 'Get ₹150/- off on fueling petrol above ₹5000' },
      { id: 'totalAmount', label: 'Total Amount (₹)', type: 'currency' },
      { id: 'pointsEarned', label: 'Points Earned', type: 'number', default: '215' },
      { id: 'bonusPoints', label: 'Bonus Points', type: 'number', default: '860' },
    ],
  },

  broadband: {
    id: 'broadband',
    name: 'Broadband Receipt',
    icon: '🌐',
    description: 'Payment receipt',
    color: '#E50914',
    fields: [
      { id: 'customerName', label: 'Customer Name', type: 'text', profileKey: 'fullName' },
      { id: 'customerNumber', label: 'Customer Number', type: 'text' },
      { id: 'receiptNo', label: 'Receipt No', type: 'text', autoGenerate: 'broadbandReceiptNo' },
      { id: 'orderNumber', label: 'Order Number', type: 'text', autoGenerate: 'broadbandOrderNo' },
      { id: 'lineOfBusiness', label: 'Line of Business', type: 'text', default: 'Broadband + Mobile' },
      { id: 'paymentType', label: 'Payment Type', type: 'text', default: 'Bill Payment' },
      { id: 'paymentDate', label: 'Payment Date', type: 'date' },
      { id: 'paymentTime', label: 'Payment Time', type: 'text', default: '09:24 AM' },
      { id: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING'] },
      { id: 'fixedLineNumber', label: 'Fixed Line Number', type: 'text', default: '08041724476' },
      { id: 'paidAmount', label: 'Paid Amount (₹)', type: 'currency', default: '6133.64' },
    ],
  },
};

export const getTemplate = (id) => TEMPLATES[id] || null;

/**
 * Templates visible on Home. Pass user tier from access store.
 * Templates with `minimumTier` (e.g. UPI receipt = 3) are omitted for lower tiers.
 */
export const getAllTemplates = (userTier = 1) => {
  const t = Number(userTier) || 1;
  return Object.values(TEMPLATES).filter(
    (template) => !template.minimumTier || t >= template.minimumTier
  );
};

export const getTemplateIds = () => Object.keys(TEMPLATES);
