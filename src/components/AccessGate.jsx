import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAccessStore } from '../context/store';
import { validateEmailAccess, isValidEmail } from '../utils/accessValidation';
import './AccessGate.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const DeniedScreen = ({ email, onRetry }) => {
  return (
    <motion.div
      className="denied-takeover"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="denied-bg">
        <div className="denied-grid" />
        <div className="denied-vignette" />
        <div className="denied-scanbeam" />
        <div className="denied-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="denied-particle" />
          ))}
        </div>
      </div>

      <div className="denied-content">
        <motion.div
          className="denied-main"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="denied-glitch-wrapper">
            <h1 className="denied-glitch" data-text="ACCESS DENIED">
              ACCESS DENIED
            </h1>
          </div>

          <motion.div
            className="denied-subtext"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            IDENTITY NOT RECOGNIZED IN SYSTEM
          </motion.div>

          <motion.div
            className="denied-email-log"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <span className="denied-email-label">QUERY:</span>
            <span className="denied-email-value">{email}</span>
            <span className="denied-email-status">// NOT FOUND</span>
          </motion.div>

          <motion.button
            className="denied-retry-btn"
            onClick={onRetry}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.3 }}
          >
            <span className="denied-retry-bracket">[</span>
            <span className="denied-retry-key">R</span>
            <span className="denied-retry-bracket">]</span>
            <span className="denied-retry-text">RETRY AUTHENTICATION</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

const RequestModal = ({ onClose }) => {
  const [reqEmail, setReqEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reqError, setReqError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setReqError('');

    if (!isValidEmail(reqEmail)) {
      setReqError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/request-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reqEmail, reason }),
      });

      if (!res.ok) throw new Error('Request failed');
      setSubmitted(true);
    } catch {
      setReqError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="request-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="request-modal"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="request-modal-header">
          <span className="request-modal-title">REQUEST ACCESS</span>
          <button className="request-modal-close" onClick={onClose}>✕</button>
        </div>

        {submitted ? (
          <div className="request-success">
            <span className="request-success-icon">✓</span>
            <p className="request-success-text">Request submitted successfully.</p>
            <p className="request-success-sub">You will be notified once approved.</p>
            <button className="request-done-btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleRequest} className="request-form">
            <div className="form-group">
              <label htmlFor="req-email">Email Address</label>
              <input
                id="req-email"
                type="email"
                value={reqEmail}
                onChange={(e) => setReqEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="req-reason">Reason <span className="optional-tag">optional</span></label>
              <textarea
                id="req-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need access?"
                rows={3}
                disabled={submitting}
              />
            </div>

            {reqError && (
              <div className="error-message">{reqError}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg access-btn"
              disabled={submitting || !reqEmail}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

const AccessGate = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState('');
  
  const navigate = useNavigate();
  const { setAccess, isWithinGracePeriod, email: cachedEmail } = useAccessStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await validateEmailAccess(email);
      
      if (result.valid === true) {
        setAccess(email);
        navigate('/home');
      } else if (result.valid === false) {
        setDeniedEmail(email);
        setIsDenied(true);
      } else if (result.error) {
        if (cachedEmail === email && isWithinGracePeriod()) {
          setAccess(email);
          navigate('/home');
        } else {
          setError('Unable to verify access. Please check your connection and try again.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = useCallback(() => {
    setIsDenied(false);
    setDeniedEmail('');
    setEmail('');
    setError('');
  }, []);

  if (isDenied) {
    return <DeniedScreen email={deniedEmail} onRetry={handleRetry} />;
  }

  return (
    <div className="access-gate">
      <div className="access-background">
        <div className="access-gradient" />
        <div className="access-grid" />
      </div>
      
      <div className="access-card">
        <div className="access-header">
          <div className="access-logo-diamond">
            <span className="access-logo-icon">⚡</span>
          </div>
          <motion.h1 
            className="access-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Bill<span className="access-title-accent">Gen</span>
          </motion.h1>
          <motion.span 
            className="access-version"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            SYS V.1.0 // ONLINE
          </motion.span>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.3 }}
          >
            Document generation system
          </motion.p>
        </div>
        
        <motion.form 
          onSubmit={handleSubmit} 
          className="access-form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
        >
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {error}
            </motion.div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary btn-lg access-btn"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Verifying...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </motion.form>
        
        <motion.div 
          className="access-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.3 }}
        >
          <p className="access-note">Access is invite-only.</p>
          <button
            type="button"
            className="request-access-btn"
            onClick={() => setShowRequestModal(true)}
          >
            Request Access
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showRequestModal && (
          <RequestModal onClose={() => setShowRequestModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessGate;
