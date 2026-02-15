import { getTemplate } from '../templates/templateConfig';
import './BillPreview.css';

const BillPreview = ({ templateId, data }) => {
  const template = getTemplate(templateId);
  
  if (!template) {
    return <div className="bill-preview-error">Template not found</div>;
  }

  const renderTemplate = () => {
    switch (templateId) {
      case 'driver':
        return <DriverSalaryTemplate data={data} />;
      case 'playo':
        return <PlayoBookingTemplate data={data} />;
      case 'petrol':
        return <ShellPetrolTemplate data={data} />;
      case 'airtel':
        return <AirtelReceiptTemplate data={data} />;
      default:
        return <GenericTemplate data={data} template={template} />;
    }
  };

  const isPhonePe = templateId === 'driver' && data.receiptType === 'PhonePe Payment';

  return (
    <div className={`bill-preview ${isPhonePe ? 'bill-preview-phonepe' : ''}`}>
      {renderTemplate()}
    </div>
  );
};

// ============================================
// DRIVER SALARY RECEIPT
// ============================================
const DriverSalaryTemplate = ({ data }) => {
  // Check if PhonePe variant
  if (data.receiptType === 'PhonePe Payment') {
    return <PhonePePaymentTemplate data={data} />;
  }

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '________';
    // Convert DD/MM/YYYY to "10 Feb 2026" format
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parseInt(parts[0]);
    const month = months[parseInt(parts[1]) - 1];
    const year = parts[2];
    return `${day} ${month} ${year}`;
  };

  const formatFullMonth = (dateStr) => {
    if (!dateStr) return '________';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // If it's already a month name
    if (months.some(m => dateStr.includes(m))) return dateStr;
    return dateStr;
  };

  return (
    <div className="template-driver">
      <h1 className="driver-title">Driver Salary Receipt</h1>
      
      <div className="driver-declaration">
        <p>
          This is to certify that I have paid <strong>₹{data.salaryAmount || '________'}</strong> to driver, <strong>Mr. {data.driverName || '________'}</strong> for the month of <strong>{data.month || '________'}</strong>. I also declare that the driver is exclusively utilised for official purpose only. Please reimburse the above amount. I further declare that what is stated above is correct and true.
        </p>
      </div>
      
      <div className="driver-info-grid">
        <div className="driver-info-row">
          <span className="driver-label">Employee Name</span>
          <span className="driver-value">{data.employeeName || '________'}</span>
        </div>
        <div className="driver-info-row">
          <span className="driver-label">Date</span>
          <span className="driver-value">{formatDateDisplay(data.receiptDate)}</span>
        </div>
      </div>
      
      <h2 className="driver-section-title">Receipt Acknowledgment</h2>
      
      <div className="driver-info-grid">
        <div className="driver-info-row">
          <span className="driver-label">Date of receipt</span>
          <span className="driver-value">{formatFullMonth(formatDateDisplay(data.receiptDate))}</span>
        </div>
        <div className="driver-info-row">
          <span className="driver-label">For the month of</span>
          <span className="driver-value">{data.month || '________'}</span>
        </div>
        <div className="driver-info-row">
          <span className="driver-label">Name of the driver</span>
          <span className="driver-value">{data.driverName || '________'}</span>
        </div>
        <div className="driver-info-row">
          <span className="driver-label">Vehicle number</span>
          <span className="driver-value">{data.vehicleNumber || '________'}</span>
        </div>
      </div>
      
      <div className="driver-received">
        <p>
          Received a sum of <strong>₹{data.salaryAmount || '________'}</strong> only for the month of <strong>{data.month || '________'}</strong> from Mr <strong>{data.employeeName || '________'}</strong>.
        </p>
      </div>
      
      <div className="driver-stamp-section">
        <div className="driver-stamp">
          <img src="/revenue-stamp.png" alt="Revenue Stamp" className="revenue-stamp-img" />
        </div>
        {data.showSignature !== false && (
          <div className="driver-signature">
            <div className="signature-line"></div>
            <p>Signature of Driver</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// PHONEPE PAYMENT RECEIPT
// ============================================
const PhonePePaymentTemplate = ({ data }) => {
  const formatAmount = (amount) => {
    if (!amount) return '0';
    const num = parseFloat(amount);
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="template-phonepe">
      {/* Green Header */}
      <div className="pp-green-header">
        <span className="pp-back">‹</span>
        <div className="pp-header-center">
          <span className="pp-success-text">Transaction Successful</span>
          <span className="pp-header-time">{data.paymentDateTime || '10:12 am on 10 Apr 2025'}</span>
        </div>
      </div>

      {/* Paid To Section */}
      <div className="pp-paid-section">
        <span className="pp-paid-label">Paid to</span>
        <div className="pp-paid-row">
          <img src="/phonepe-icon.png" alt="" className="pp-paid-icon" />
          <div className="pp-paid-info">
            <span className="pp-paid-name">{data.driverName || 'Sabarish A'}</span>
            <span className="pp-paid-phone">{data.recipientPhone || '+919176657929'}</span>
          </div>
          <span className="pp-paid-amount">₹{formatAmount(data.salaryAmount)}</span>
        </div>
      </div>

      {/* Banking Name */}
      <div className="pp-banking-row">
        <span className="pp-banking-label">Banking Name :</span>
        <span className="pp-banking-value">{data.driverName || 'Sabarish A'}</span>
        <span className="pp-banking-check">✓</span>
      </div>

      {/* Payment Details */}
      <div className="pp-payment-details">
        <img src="/phonepe-icon.png" alt="" className="pp-details-icon" />
        <span className="pp-details-text">Payment Details</span>
        <span className="pp-details-expand">∧</span>
      </div>

      {/* Transaction ID */}
      <div className="pp-transaction">
        <span className="pp-txn-label">Transaction ID</span>
        <span className="pp-txn-id">{data.transactionId || '238291039476'}</span>
      </div>

      {/* Debited From */}
      <div className="pp-debit">
        <span className="pp-debit-label">Debited from</span>
        <div className="pp-debit-row">
          <img src="/icici-logo.png" alt="ICICI" className="pp-bank-logo" />
          <div className="pp-debit-info">
            <span className="pp-account">{data.bankAccount || 'XXXXXX8331'}</span>
            <span className="pp-utr">UTR: {data.utr || 'TRa8Djsl90Fdbq'}</span>
          </div>
          <span className="pp-debit-amount">₹{formatAmount(data.salaryAmount)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pp-actions">
        <div className="pp-action">
          <img src="/pp-send-again.png" alt="" className="pp-action-icon" />
          <span>Send Again</span>
        </div>
        <div className="pp-action">
          <img src="/pp-view-history.png" alt="" className="pp-action-icon" />
          <span>View History</span>
        </div>
        <div className="pp-action">
          <img src="/pp-split-expense.png" alt="" className="pp-action-icon" />
          <span>Split Expense</span>
        </div>
        <div className="pp-action">
          <img src="/pp-share-receipt.png" alt="" className="pp-action-icon" />
          <span>Share Receipt</span>
        </div>
      </div>

      {/* Contact Support */}
      <div className="pp-support">
        <div className="pp-support-icon">?</div>
        <span className="pp-support-text">Contact PhonePe Support</span>
        <span className="pp-support-arrow">›</span>
      </div>

      {/* Powered By */}
      <div className="pp-powered">
        <img src="/pp-powered-by.png" alt="Powered by UPI & Yes Bank" className="pp-powered-img" />
      </div>
    </div>
  );
};

// ============================================
// PLAYO SPORTS BOOKING
// ============================================
const PlayoBookingTemplate = ({ data }) => {
  const formatPlayoDate = (dateStr) => {
    if (!dateStr) return '________';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = parseInt(parts[0]).toString().padStart(2, '0');
    const month = months[parseInt(parts[1]) - 1];
    const year = parts[2];
    return `${day} ${month} ${year}`;
  };

  const formatSlotDate = (dateStr) => {
    if (!dateStr) return '________';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  };

  return (
    <div className="template-playo">
      <div className="playo-logo">
        <img src="/playo-logo.png" alt="Playo" />
      </div>
      
      <div className="playo-banner">
        <img src="/playo-banner.png" alt="Booking Confirmed" />
      </div>
      
      <div className="playo-content">
        <div className="playo-greeting">
          Hey {data.customerName || '________'},
        </div>
        
        <div className="playo-message">
          Your booking for <strong>{data.sportType || '________'}</strong> at <strong>{data.venueName || '________'}, {data.venueCity || '________'}</strong> has been confirmed. Please find booking details in Playo app.
        </div>
        
        <div className="playo-note">
          Note: An activity also has been created for this booking, kindly check in the "My Calendar" section in the app.
        </div>
      </div>
      
      <div className="playo-details">
        {/* Left Column - Booking Info */}
        <div className="playo-booking-info">
          <div className="playo-detail-row">
            <span className="playo-label">Booking ID:</span>
            <span className="playo-value-bold">{data.bookingId || '________'}</span>
          </div>
          <div className="playo-detail-row">
            <span className="playo-label">Sport:</span>
            <span className="playo-value-bold">{data.sportType || '________'}</span>
          </div>
          <div className="playo-detail-row">
            <span className="playo-label">Court:</span>
            <span className="playo-value-bold">{data.court || '________'}</span>
          </div>
          <div className="playo-detail-row">
            <span className="playo-label">Slot:</span>
            <span className="playo-value-bold playo-slot">{data.slotTime || '________'} on {formatSlotDate(data.slotDate)}</span>
          </div>
        </div>
        
        {/* Right Column - Payment Info */}
        <div className="playo-payment-info">
          <div className="playo-payment-header">
            <span className="playo-payment-title">Total Amount Paid</span>
            <span className="playo-payment-amount">₹{data.totalAmount || '0'}</span>
          </div>
          
          <div className="playo-payment-row">
            <span className="playo-payment-label">Court Price:</span>
            <span className="playo-payment-value">₹{data.courtPrice || '0'}</span>
          </div>
          <div className="playo-payment-row">
            <span className="playo-payment-label">Convenience Fee:</span>
            <span className="playo-payment-value">₹{data.convenienceFee || '0'}</span>
          </div>
          <div className="playo-payment-row">
            <span className="playo-payment-label">Discount / Karma availed:</span>
            <span className="playo-payment-value playo-discount">- ₹{data.discount || '0'}</span>
          </div>
          <div className="playo-payment-row">
            <span className="playo-payment-label">Fitness Cover:</span>
            <span className="playo-payment-value">₹0.0</span>
          </div>
          
          <div className="playo-payment-divider"></div>
          
          <div className="playo-payment-header">
            <span className="playo-payment-title">Advance Paid</span>
            <span className="playo-payment-amount">₹{data.advancePaid || '0'}</span>
          </div>
          <div className="playo-payment-row">
            <span className="playo-payment-label">Paid Online</span>
            <span className="playo-payment-value">₹{data.advancePaid || '0'}</span>
          </div>
          
          <div className="playo-payment-divider"></div>
          
          <div className="playo-payment-header">
            <span className="playo-payment-title">Payable at the venue:</span>
            <span className="playo-payment-value">₹{data.payableAtVenue || '0'}</span>
          </div>
        </div>
      </div>
      
      <div className="playo-footer">
        <span>Booked on {formatPlayoDate(data.bookingDate)}, {data.bookingTime || '________'}</span>
      </div>
    </div>
  );
};

// ============================================
// SHELL PETROL BILL
// ============================================
const ShellPetrolTemplate = ({ data }) => {
  const formatShellDate = (dateStr) => {
    if (!dateStr) return '________';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  const calculateSubtotal = () => {
    const qty = parseFloat(data.quantity) || 0;
    const rate = parseFloat(data.ratePerLitre) || 0;
    return (qty * rate).toFixed(2);
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(calculateSubtotal()) || 0;
    const discount = parseFloat(data.discount) || 0;
    return (subtotal - discount).toFixed(2);
  };

  return (
    <div className="template-shell">
      <div className="shell-transaction-header">
        <h2>Transaction details</h2>
      </div>
      
      <div className="shell-transaction-info">
        <p className="shell-datetime">{formatShellDate(data.transactionDate)}, {data.transactionTime || '________'}</p>
        <p className="shell-location">{data.location || '________'}</p>
        <p className="shell-txn-id">{data.transactionId || '________'}</p>
      </div>
      
      <div className="shell-purchased-header">
        <span>Purchased items</span>
      </div>
      
      <div className="shell-items">
        <div className="shell-item-row">
          <div className="shell-item-left">
            <span className="shell-item-name">{data.fuelCode || '02'} - {data.fuelType || 'V-PowerUNL'}</span>
            <span className="shell-item-detail">{data.quantity || '0'} x INR {data.ratePerLitre || '0'}</span>
          </div>
          <span className="shell-item-amount">INR {calculateSubtotal()}</span>
        </div>
        
        {data.discount && parseFloat(data.discount) > 0 && (
          <div className="shell-discount-row">
            <span className="shell-discount-text">{data.discountText || 'Discount'}</span>
            <span className="shell-discount-amount">- INR {parseFloat(data.discount).toFixed(2)}</span>
          </div>
        )}
      </div>
      
      <div className="shell-total">
        <span className="shell-total-label">Total Paid</span>
        <span className="shell-total-amount">INR {data.totalAmount || calculateTotal()}</span>
      </div>
      
      <div className="shell-points">
        <div className="shell-points-row">
          <span>Points earned</span>
          <span className="shell-points-value">+ {data.pointsEarned || '0'}</span>
        </div>
        {data.bonusPoints && parseFloat(data.bonusPoints) > 0 && (
          <div className="shell-points-row">
            <span>Points earned (bonus)</span>
            <span className="shell-points-value">+ {data.bonusPoints}</span>
          </div>
        )}
      </div>
      
      <div className="shell-footer">
        <div className="shell-logo">
          <img src="/shell-logo.png" alt="Shell" className="shell-pecten" />
        </div>
        <p className="shell-thank-you">Thank you for visiting Shell</p>
        <p className="shell-footer-note">For full details please refer to your receipt</p>
      </div>
    </div>
  );
};

// ============================================
// AIRTEL BROADBAND RECEIPT
// ============================================
const AirtelReceiptTemplate = ({ data }) => {
  const formatAirtelDate = (dateStr) => {
    if (!dateStr) return '________';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  return (
    <div className="template-airtel">
      {/* Paid Watermark */}
      <div className="airtel-watermark">Paid</div>
      
      {/* Logo */}
      <div className="airtel-logo">
        <img src="/airtel-logo.png" alt="Airtel" />
      </div>
      
      {/* Company Info */}
      <div className="airtel-company">
        <p className="airtel-company-name">Bharti Airtel Limited</p>
        <p className="airtel-doc-type">payment receipt</p>
      </div>
      
      {/* Thank you message */}
      <div className="airtel-thankyou">
        Thank you for choosing airtel service. Here is the payment receipt.
      </div>
      
      {/* Details Table */}
      <div className="airtel-table">
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Receipt No.</div>
          <div className="airtel-cell airtel-value">{data.receiptNo || '________'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Customer Name</div>
          <div className="airtel-cell airtel-value">{data.customerName || '________'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Customer Number</div>
          <div className="airtel-cell airtel-value">{data.customerNumber || '________'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Order Number</div>
          <div className="airtel-cell airtel-value">{data.orderNumber || '________'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Line of Business</div>
          <div className="airtel-cell airtel-value">{data.lineOfBusiness || '________'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Payment type</div>
          <div className="airtel-cell airtel-value">{data.paymentType || '________'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Payment date & time</div>
          <div className="airtel-cell airtel-value">{formatAirtelDate(data.paymentDate)}  {data.paymentTime || '________'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Payment mode</div>
          <div className="airtel-cell airtel-value">{data.paymentMode || '________'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">Paid amount</div>
          <div className="airtel-cell airtel-value">₹ {data.paidAmount || '0.00'}</div>
        </div>
        <div className="airtel-row">
          <div className="airtel-cell airtel-label">FIXED_LINE {data.fixedLineNumber || '________'}</div>
          <div className="airtel-cell airtel-value">₹ {data.paidAmount || '0.00'}</div>
        </div>
      </div>
      
      {/* Terms and Conditions */}
      <div className="airtel-terms-section">
        <p className="airtel-terms-title">Terms and Conditions</p>
        <p className="airtel-terms-text">
          Payment posting to your account is subject to credit settlement by your bank and will get the same posted within next 2-working days (maximum).
        </p>
        <p className="airtel-terms-text">The above amount is inclusive of applicable Taxes.</p>
        <p className="airtel-terms-text">All claims subject to exclusive jurisdiction of Delhi courts only.</p>
      </div>
      
      {/* Discrepancy notice */}
      <div className="airtel-discrepancy">
        If you found any discrepancy, please reach out to us through:
      </div>
      
      {/* Airtel Thanks App */}
      <div className="airtel-app-info">
        Airtel Thanks App {'>'} Help {'>'} Billing & Payments related issue {'>'} Payments related {'>'} Payment not posted
      </div>
      
      {/* System generated notice */}
      <div className="airtel-notice">
        This is a system-generated receipt and does not require signature. Any unauthorized use, disclosure, dissemination or copying of this receipt is strictly prohibited and may be unlawful.
      </div>
      
      {/* Footer */}
      <div className="airtel-footer">
        <p>Regd. Office: Bharti Airtel Ltd, Plot No. 16, Udyog Vihar Phase - IV, Gurgaon, Haryana. 122 015</p>
        <p>GSTN: 06AAACB2894G1ZR | PAN: AAACB2894G</p>
      </div>
    </div>
  );
};

// ============================================
// GENERIC TEMPLATE (Fallback)
// ============================================
const GenericTemplate = ({ data, template }) => (
  <div className="template-generic">
    <div className="generic-header">
      <span className="icon">{template.icon}</span>
      <h2>{template.name}</h2>
    </div>
    <div className="generic-body">
      {template.fields.map(field => (
        <div key={field.id} className="detail-row">
          <span className="label">{field.label}</span>
          <span className="value">{data[field.id] || '—'}</span>
        </div>
      ))}
    </div>
  </div>
);

export default BillPreview;
