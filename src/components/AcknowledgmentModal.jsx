import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from '@phosphor-icons/react';
import './AcknowledgmentModal.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const AcknowledgmentModal = ({ isOpen, email, templateId, onConfirm, onClose }) => {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setChecked(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!checked || submitting) return;
    setSubmitting(true);

    const payload = {
      email: email || '',
      templateId: templateId || '',
      timestamp: new Date().toISOString(),
    };

    let sheetOk = false;
    try {
      const res = await fetch(`${API_URL}/api/log-acknowledgment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      sheetOk = data.success === true;
    } catch {
      sheetOk = false;
    }

    setSubmitting(false);
    setChecked(false);
    onConfirm?.(sheetOk);
  };

  const handleDismiss = () => {
    if (submitting) return;
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="ack-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleDismiss}
        >
          <motion.div
            className="ack-modal"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="ack-dialog-title"
            aria-describedby="ack-dialog-desc"
          >
            <button
              type="button"
              className="ack-close"
              onClick={handleDismiss}
              disabled={submitting}
              aria-label="Close"
            >
              <X size={20} weight="bold" />
            </button>
            <h2 id="ack-dialog-title" className="ack-title">
              BEFORE YOU DOWNLOAD
            </h2>
            <div id="ack-dialog-desc" className="ack-body">
              <p>
                Ravenlog output is for <strong>personal record-keeping only</strong>. Do not submit
                generated documents to an employer, tax authority, insurance company, or financial
                institution as proof of a real transaction.
              </p>
              <p className="ack-body-note">
                By downloading, you confirm you have read our{' '}
                <Link to="/terms" className="ack-terms-link" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </Link>{' '}
                and agree to use Ravenlog accordingly.
              </p>
            </div>

            <label className={`ack-consent ${submitting ? 'ack-consent-disabled' : ''}`}>
              <input
                type="checkbox"
                className="ack-consent-input"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                disabled={submitting}
              />
              <span className="ack-consent-box" aria-hidden="true">
                {checked && <Check className="ack-consent-check" size={14} weight="bold" aria-hidden />}
              </span>
              <span className="ack-consent-label">
                I have read and understand the above.
              </span>
            </label>

            <button
              type="button"
              className="ack-confirm-btn"
              onClick={handleConfirm}
              disabled={!checked || submitting}
            >
              {submitting ? (
                <>
                  <span className="ack-btn-spinner" />
                  SAVING…
                </>
              ) : (
                'I UNDERSTAND, DOWNLOAD'
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AcknowledgmentModal;
