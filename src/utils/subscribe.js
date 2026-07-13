import { loadRazorpay } from './razorpay';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Runs the full Razorpay subscription flow: create order -> open checkout ->
 * verify payment. Shared by PaywallModal, SubscriptionExpired and SetupWizard.
 *
 * @param {Object} opts
 * @param {string} opts.email        User's email (order + prefill).
 * @param {Function} [opts.onSuccess] Called with the verify result on success.
 * @param {Function} [opts.onError]  Called with a human-readable message on failure.
 * @param {Function} [opts.onDismiss] Called when the user closes the checkout.
 */
export async function startSubscription({ email, onSuccess, onError, onDismiss }) {
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
            onSuccess?.(result);
          } else {
            onError?.('Payment verification failed. Contact support if charged.');
          }
        } catch {
          onError?.('Verification error. Your payment is safe — access will be granted shortly.');
        }
      },
      prefill: { email },
      theme: { color: '#06b6d4' },
      modal: { ondismiss: () => onDismiss?.() },
    };

    const RazorpayClass = await loadRazorpay();
    const rzp = new RazorpayClass(options);
    rzp.on('payment.failed', () => onError?.('Payment failed. Please try again.'));
    rzp.open();
  } catch (err) {
    console.error('Payment initiation error:', err);
    onError?.(`Could not initiate payment: ${err.message}`);
  }
}
