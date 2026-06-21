import { Check } from '@phosphor-icons/react';
import { isPdfLogoDataUrl } from '../utils/logoHelpers';
import { getTemplate } from '../templates/templateConfig';
import TemplateIcon from './TemplateIcon';
import './BillPreview.css';

/** Third-party marks, bank/UPI strips, and tier-3 GST line — tier 3+ only. */
const showBrandedAssetsForTier = (tier) => Number(tier) >= 3;

/** User-uploaded logo — placement matches each template’s native logo area. */
function BusinessLogo({ logoUrl, variant, carrierMarkOffset }) {
  if (!logoUrl || !variant) return null;
  const cls = [
    'bill-business-logo-wrap',
    `bill-business-logo-wrap--${variant}`,
    variant === 'broadband' && carrierMarkOffset
      ? 'bill-business-logo-wrap--broadband-offset'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      {isPdfLogoDataUrl(logoUrl) ? (
        <object
          data={logoUrl}
          type="application/pdf"
          className="bill-business-logo-img bill-business-logo-pdf"
          aria-label=""
        />
      ) : (
        <img src={logoUrl} alt="" className="bill-business-logo-img" />
      )}
    </div>
  );
}

const BillPreview = ({ templateId, data, tier = 1, logoUrl = null }) => {
  const template = getTemplate(templateId);
  const showBrandedAssets = showBrandedAssetsForTier(tier);

  if (!template) {
    return <div className="bill-preview-error">Template not found</div>;
  }

  const isUpiTemplate = templateId === 'upi';
  const tierNum = Number(tier);
  const allowUploadLogo = tierNum < 3;
  const effectiveLogoUrl =
    allowUploadLogo && logoUrl && !isUpiTemplate ? logoUrl : null;

  const renderTemplate = () => {
    switch (templateId) {
      case 'driver':
        return (
          <DriverSalaryTemplate data={data} showBrandedAssets={showBrandedAssets} />
        );
      case 'upi':
        return (
          <UpiPaymentTemplate data={data} showBrandedAssets={showBrandedAssets} />
        );
      case 'playo':
        return (
          <PlayoBookingTemplate
            data={data}
            showBrandedAssets={showBrandedAssets}
            logoUrl={effectiveLogoUrl}
          />
        );
      case 'petrol':
        return (
          <ShellPetrolTemplate
            data={data}
            showBrandedAssets={showBrandedAssets}
            logoUrl={effectiveLogoUrl}
          />
        );
      case 'broadband':
        return (
          <BroadbandReceiptTemplate
            data={data}
            showBrandedAssets={showBrandedAssets}
            logoUrl={effectiveLogoUrl}
          />
        );
      default:
        return <GenericTemplate data={data} template={template} />;
    }
  };

  return (
    <div className={`bill-preview ${isUpiTemplate ? 'bill-preview-upi' : ''}`}>
      {renderTemplate()}
    </div>
  );
};

// ============================================
// DRIVER SALARY RECEIPT
// ============================================
const DriverSalaryTemplate = ({ data, showBrandedAssets }) => {
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
        {showBrandedAssets && (
          <div className="driver-stamp">
            <img src="/revenue-stamp.png" alt="Revenue Stamp" className="revenue-stamp-img" />
          </div>
        )}
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
// UPI-STYLE PAYMENT RECEIPT (driver template)
// ============================================
const UpiPaymentTemplate = ({ data, showBrandedAssets }) => {
  const formatAmount = (amount) => {
    if (!amount) return '0';
    const num = parseFloat(amount);
    return num.toLocaleString('en-IN');
  };

  return (
    <div className="template-upi">
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
        <Check className="pp-banking-check" size={16} weight="bold" aria-hidden />
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
        <span className="pp-support-text">Contact support</span>
        <span className="pp-support-arrow">›</span>
      </div>

      {/* Powered By — tier 3+ only (UPI / Yes Bank strip) */}
      {showBrandedAssets && (
        <div className="pp-powered">
          <img src="/pp-powered-by.png" alt="Powered by UPI & Yes Bank" className="pp-powered-img" />
        </div>
      )}
    </div>
  );
};

// ============================================
// PLAYO SPORTS BOOKING
// ============================================
const PlayoBookingTemplate = ({ data, showBrandedAssets, logoUrl }) => {
  const calculateTotal = () => {
    const court = parseFloat(data.courtPrice) || 0;
    const fee = parseFloat(data.convenienceFee) || 0;
    const disc = parseFloat(data.discount) || 0;
    return (court + fee - disc).toFixed(2);
  };

  const calculatePayable = () => {
    const total = parseFloat(calculateTotal()) || 0;
    const advance = parseFloat(data.advancePaid) || 0;
    return Math.max(0, total - advance).toFixed(2);
  };

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
      <BusinessLogo logoUrl={logoUrl} variant="playo" />
      {showBrandedAssets && (
        <div className={`playo-logo${logoUrl ? ' playo-logo--with-business' : ''}`}>
          <img src="/playo-logo.png" alt="Playo" />
        </div>
      )}
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
            <span className="playo-payment-amount">₹{calculateTotal()}</span>
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
            <span className="playo-payment-value">₹{calculatePayable()}</span>
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
const ShellPetrolTemplate = ({ data, showBrandedAssets, logoUrl }) => {
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
    const discount = data.showDiscount ? (parseFloat(data.discount) || 0) : 0;
    return (subtotal - discount).toFixed(2);
  };

  return (
    <div className="template-shell">
      <div className="shell-transaction-header">
        <h2 className={showBrandedAssets ? '' : 'shell-transaction-header--unbranded'}>Transaction details</h2>
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
        
        {data.showDiscount && parseFloat(data.discount) > 0 && (
          <div className="shell-discount-row">
            <span className="shell-discount-text">{data.discountText || 'Discount'}</span>
            <span className="shell-discount-amount">- INR {parseFloat(data.discount).toFixed(2)}</span>
          </div>
        )}
      </div>
      
      <div className="shell-total">
        <span className="shell-total-label">Total Paid</span>
        <span className="shell-total-amount">INR {calculateTotal()}</span>
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
        {logoUrl ? (
          <BusinessLogo logoUrl={logoUrl} variant="shell" />
        ) : showBrandedAssets ? (
          <div className="shell-logo">
            <img src="/shell-logo.png" alt="Shell" className="shell-pecten" />
          </div>
        ) : null}
        <p className="shell-thank-you">
          {showBrandedAssets && !logoUrl
            ? 'Thank you for visiting Shell'
            : 'Thank you for visiting'}
        </p>
        <p className="shell-footer-note">For full details please refer to your receipt</p>
      </div>
    </div>
  );
};

// ============================================
// BROADBAND / TELECOM PAYMENT RECEIPT
// ============================================
const BroadbandReceiptTemplate = ({ data, showBrandedAssets, logoUrl }) => {
  const formatPaymentDate = (dateStr) => {
    if (!dateStr) return '________';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  };

  return (
    <div className="template-broadband">
      <BusinessLogo
        logoUrl={logoUrl}
        variant="broadband"
        carrierMarkOffset={showBrandedAssets}
      />
      <div className="bb-watermark">Paid</div>

      {showBrandedAssets && (
        <div className="bb-carrier-mark">
          <img src="/telecom-carrier-mark.png" alt="" />
        </div>
      )}

      <div className="bb-company">
        <p className="bb-company-name">Connectivity Services Limited</p>
        <p className="bb-doc-type">payment receipt</p>
      </div>

      <div className="bb-thankyou">
        Thank you for choosing our services. Here is your payment receipt.
      </div>

      <div className="bb-table">
        <div className="bb-row">
          <div className="bb-cell bb-label">Receipt No.</div>
          <div className="bb-cell bb-value">{data.receiptNo || '________'}</div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">Customer Name</div>
          <div className="bb-cell bb-value">{data.customerName || '________'}</div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">Customer Number</div>
          <div className="bb-cell bb-value">{data.customerNumber || '________'}</div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">Order Number</div>
          <div className="bb-cell bb-value">{data.orderNumber || '________'}</div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">Line of Business</div>
          <div className="bb-cell bb-value">{data.lineOfBusiness || '________'}</div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">Payment type</div>
          <div className="bb-cell bb-value">{data.paymentType || '________'}</div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">Payment date & time</div>
          <div className="bb-cell bb-value">
            {formatPaymentDate(data.paymentDate)} {data.paymentTime || '________'}
          </div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">Payment mode</div>
          <div className="bb-cell bb-value">{data.paymentMode || '________'}</div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">Paid amount</div>
          <div className="bb-cell bb-value">₹ {data.paidAmount || '0.00'}</div>
        </div>
        <div className="bb-row">
          <div className="bb-cell bb-label">FIXED_LINE {data.fixedLineNumber || '________'}</div>
          <div className="bb-cell bb-value">₹ {data.paidAmount || '0.00'}</div>
        </div>
      </div>

      <div className="bb-terms-section">
        <p className="bb-terms-title">Terms and Conditions</p>
        <p className="bb-terms-text">
          Payment posting to your account is subject to credit settlement by your bank and will get the same posted within next 2-working days (maximum).
        </p>
        <p className="bb-terms-text">The above amount is inclusive of applicable Taxes.</p>
        <p className="bb-terms-text">All claims subject to exclusive jurisdiction of Delhi courts only.</p>
      </div>

      <div className="bb-discrepancy">
        If you found any discrepancy, please reach out to us through:
      </div>

      <div className="bb-app-info">
        Customer app {'>'} Help {'>'} Billing & payments {'>'} Payments {'>'} Payment not posted
      </div>

      <div className="bb-notice">
        This is a system-generated receipt and does not require signature. Any unauthorized use, disclosure, dissemination or copying of this receipt is strictly prohibited and may be unlawful.
      </div>

      <div className="bb-footer">
        <p>Regd. Office: As per records on your service account.</p>
        {showBrandedAssets && (
          <p>GSTIN / PAN: As shown on your tax records where applicable.</p>
        )}
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
      <span className="icon">
        <TemplateIcon templateId={template.id} size={28} weight="duotone" />
      </span>
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
