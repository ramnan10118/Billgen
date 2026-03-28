import { useState } from 'react';
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
      const res = await fetch(`${API_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Failed');
      const { subscriptionId, keyId } = await res.json();

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Ravenlog',
        description: 'Unlimited document generation — ₹149/month',
        handler: async (response) => {
          try {
            await fetch(`${API_URL}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            updateSubscription({
              isSubscribed: true,
              subscribedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              daysRemaining: 30,
              renewalDue: false,
            });
          } catch { /* webhook handles it */ }
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
      <button className="renewal-banner-dismiss" onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
};

export default RenewalBanner;
