// Template configurations - defines fields and metadata for each bill type

export const TEMPLATES = {
  driver: {
    id: 'driver',
    name: 'Driver Salary Receipt',
    icon: '🚗',
    description: 'Driver salary declaration & receipt',
    color: '#374151',
    fields: [
      { id: 'receiptType', label: 'Receipt Type', type: 'select', options: ['Salary Receipt', 'PhonePe Payment'], default: 'Salary Receipt' },
      // Common fields
      { id: 'driverName', label: 'Driver/Recipient Name', type: 'text', profileKey: 'driverName' },
      { id: 'salaryAmount', label: 'Amount (₹)', type: 'currency', default: '25000' },
      // Salary Receipt fields
      { id: 'employeeName', label: 'Employee Name (You)', type: 'text', profileKey: 'fullName', showWhen: { field: 'receiptType', value: 'Salary Receipt' } },
      { id: 'month', label: 'For Month', type: 'period', showWhen: { field: 'receiptType', value: 'Salary Receipt' } },
      { id: 'receiptDate', label: 'Receipt Date', type: 'date', showWhen: { field: 'receiptType', value: 'Salary Receipt' } },
      { id: 'vehicleNumber', label: 'Vehicle Number', type: 'text', profileKey: 'vehicleNumber', showWhen: { field: 'receiptType', value: 'Salary Receipt' } },
      { id: 'showSignature', label: 'Show Signature Line', type: 'toggle', default: true, showWhen: { field: 'receiptType', value: 'Salary Receipt' } },
      // PhonePe fields
      { id: 'recipientPhone', label: 'Recipient Phone', type: 'text', default: '+919176657929', showWhen: { field: 'receiptType', value: 'PhonePe Payment' } },
      { id: 'transactionId', label: 'Transaction ID', type: 'text', autoGenerate: 'phonePeTxnId', showWhen: { field: 'receiptType', value: 'PhonePe Payment' } },
      { id: 'utr', label: 'UTR Number', type: 'text', autoGenerate: 'utrNumber', showWhen: { field: 'receiptType', value: 'PhonePe Payment' } },
      { id: 'bankAccount', label: 'Bank Account (masked)', type: 'text', default: 'XXXXXX8331', showWhen: { field: 'receiptType', value: 'PhonePe Payment' } },
      { id: 'bankName', label: 'Bank Name', type: 'text', default: 'ICICI', showWhen: { field: 'receiptType', value: 'PhonePe Payment' } },
      { id: 'paymentDateTime', label: 'Payment Date & Time', type: 'text', default: '10:12 am on 10 Apr 2025', showWhen: { field: 'receiptType', value: 'PhonePe Payment' } },
    ],
  },

  playo: {
    id: 'playo',
    name: 'Playo Sports Booking',
    icon: '⚽',
    description: 'Sports facility booking confirmation',
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
      { id: 'totalAmount', label: 'Total Amount (₹)', type: 'currency', default: '2456.64' },
      { id: 'advancePaid', label: 'Advance Paid (₹)', type: 'currency', default: '2456.64' },
      { id: 'payableAtVenue', label: 'Payable at Venue (₹)', type: 'currency', default: '0' },
      { id: 'bookingDate', label: 'Booked On (Date)', type: 'date' },
      { id: 'bookingTime', label: 'Booked On (Time)', type: 'text', default: '18:25 PM' },
    ],
  },

  petrol: {
    id: 'petrol',
    name: 'Shell Petrol Bill',
    icon: '⛽',
    description: 'Shell fuel station receipt',
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

  airtel: {
    id: 'airtel',
    name: 'Airtel Broadband Receipt',
    icon: '🌐',
    description: 'Airtel payment receipt',
    color: '#E50914',
    fields: [
      { id: 'customerName', label: 'Customer Name', type: 'text', profileKey: 'fullName' },
      { id: 'customerNumber', label: 'Customer Number', type: 'text' },
      { id: 'receiptNo', label: 'Receipt No', type: 'text', autoGenerate: 'airtelReceiptNo' },
      { id: 'orderNumber', label: 'Order Number', type: 'text', autoGenerate: 'airtelOrderNo' },
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

export const getAllTemplates = () => Object.values(TEMPLATES);

export const getTemplateIds = () => Object.keys(TEMPLATES);
