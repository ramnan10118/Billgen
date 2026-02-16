import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAccessStore } from '../context/store';
import { validateEmailAccess, isValidEmail } from '../utils/accessValidation';
import './AccessGate.css';

const AccessGate = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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
        setError('Access denied. Your email is not on the approved list. Please contact the admin.');
      } else if (result.error) {
        // Network error - check grace period
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
          <button type="button" className="request-access-btn">
            Request Access
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AccessGate;
