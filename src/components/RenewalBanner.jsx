import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { useAccessStore } from '../context/store';
import { loadRazorpay } from '../utils/razorpay';
import './SubscriptionExpired.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const RenewalBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { email, daysRemaining, updateSubscription } = useAccessStore();

  if (dismissed) return null;

  const handleRenew = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-order', email }),
      });

      if (!res.ok) throw new Error('Failed');
      const { orderId, amount, currency, keyId } = await res.json();

      const options = {
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: 'Ravenlog',
        description: 'Unlimited document generation — ₹149/month',
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_URL}/api/payments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'verify-order',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email,
              }),
            });
            const result = await verifyRes.json();
            if (result.verified) {
              updateSubscription({
                isSubscribed: true,
                subscribedUntil: result.subscribedUntil,
                daysRemaining: 30,
                renewalDue: false,
              });
            }
          } catch { /* silent — UI will revalidate on next load */ }
        },
        prefill: { email },
        theme: { color: '#06b6d4' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const RazorpayClass = await loadRazorpay();
      const rzp = new RazorpayClass(options);
      rzp.on('payment.failed', () => setLoading(false));
      rzp.open();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="renewal-banner">
      <span className="renewal-banner-text">
        Subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
      </span>
      <button className="renewal-banner-btn" onClick={handleRenew} disabled={loading}>
        {loading ? 'Processing...' : 'Renew now'}
      </button>
      <button
        type="button"
        className="renewal-banner-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <X size={18} weight="bold" />
      </button>
    </div>
  );
};

export default RenewalBanner;
