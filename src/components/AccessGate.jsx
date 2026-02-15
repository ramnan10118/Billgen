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
      
      <motion.div 
        className="access-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="access-header">
          <motion.div 
            className="access-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            📄
          </motion.div>
          <h1>BillGen</h1>
          <p>Quick bill generation for monthly reimbursements</p>
        </div>
        
        <form onSubmit={handleSubmit} className="access-form">
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
        </form>
        
        <p className="access-note">
          Access is invite-only. Contact the admin to get added.
        </p>
      </motion.div>
    </div>
  );
};

export default AccessGate;
