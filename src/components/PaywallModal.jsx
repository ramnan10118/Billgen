import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { useAccessStore } from '../context/store';
import { loadRazorpay } from '../utils/razorpay';
import './PaywallModal.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const PaywallModal = ({ isOpen, onClose, onSubscribed }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { email, downloadsUsed, downloadsLimit } = useAccessStore();

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Failed to create subscription');
      const { subscriptionId, keyId } = await res.json();

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Ravenlog',
        description: 'Unlimited document generation — ₹149/month',
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_URL}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const result = await verifyRes.json();
            if (result.verified) {
              onSubscribed?.();
            } else {
              setError('Payment verification failed. Contact support if charged.');
            }
          } catch {
            setError('Verification error. Your payment is safe — access will be granted shortly.');
          }
        },
        prefill: { email },
        theme: { color: '#06b6d4' },
        modal: {
          ondismiss: () => setLoading(false),
        },
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="paywall-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="paywall-modal"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="paywall-close" onClick={onClose} aria-label="Close">
              <X size={22} weight="bold" />
            </button>

            <div className="paywall-icon">
              <span>⚡</span>
            </div>

            <h2 className="paywall-title">FREE DOWNLOADS USED</h2>
            <p className="paywall-subtitle">
              You've used all {downloadsLimit} free downloads.
            </p>

            <div className="paywall-counter">
              <span className="paywall-count">{downloadsUsed}</span>
              <span className="paywall-separator">/</span>
              <span className="paywall-limit">{downloadsLimit}</span>
            </div>

            <div className="paywall-offer">
              <div className="paywall-price">
                <span className="paywall-currency">₹</span>
                <span className="paywall-amount">149</span>
                <span className="paywall-period">/month</span>
              </div>
              <p className="paywall-offer-desc">Unlimited document generation</p>
            </div>

            {error && (
              <div className="paywall-error">{error}</div>
            )}

            <button
              className="btn btn-primary paywall-subscribe-btn"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Processing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </button>

            <p className="paywall-note">Cancel anytime. Powered by Razorpay.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;
