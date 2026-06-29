import { useState } from 'react';
import { motion } from 'motion/react';
import { Timer } from '@phosphor-icons/react';
import { useAccessStore } from '../context/store';
import { loadRazorpay } from '../utils/razorpay';
import './SubscriptionExpired.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const SubscriptionExpired = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { email, updateSubscription } = useAccessStore();

  const handleRenew = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-order', email }),
      });

      if (!res.ok) throw new Error('Failed to create order');
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
            } else {
              setError('Payment verification failed. Contact support if charged.');
            }
          } catch {
            setError('Verification error. Your payment is safe — access will be granted shortly.');
          }
        },
        prefill: { email },
        theme: { color: '#06b6d4' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const RazorpayClass = await loadRazorpay();
      const rzp = new RazorpayClass(options);
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError('Could not initiate payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="sub-expired">
      <div className="sub-expired-bg">
        <div className="sub-expired-grid" />
        <div className="sub-expired-vignette" />
        <div className="sub-expired-scanbeam" />
      </div>

      <motion.div
        className="sub-expired-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="sub-expired-icon">
          <Timer size={40} weight="duotone" />
        </div>

        <h1 className="sub-expired-title" data-text="SUBSCRIPTION EXPIRED">
          SUBSCRIPTION EXPIRED
        </h1>

        <p className="sub-expired-subtitle">
          Renew for ₹149/month to continue generating bills.
        </p>

        <div className="sub-expired-price">
          <span className="sub-expired-currency">₹</span>
          <span className="sub-expired-amount">149</span>
          <span className="sub-expired-period">/month</span>
        </div>

        {error && <div className="sub-expired-error">{error}</div>}

        <button
          className="btn btn-primary sub-expired-btn"
          onClick={handleRenew}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Processing...
            </>
          ) : (
            'Renew Now'
          )}
        </button>

        <p className="sub-expired-note">
          Powered by Razorpay. Cancel anytime.
        </p>
      </motion.div>
    </div>
  );
};

export default SubscriptionExpired;
