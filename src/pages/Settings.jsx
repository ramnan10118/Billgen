import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useProfileStore } from '../context/store';
import Layout from '../components/Layout';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, updateProfile, isProfileComplete } = useProfileStore();
  
  const showOnboarding = location.state?.showOnboarding && !isProfileComplete();
  
  const [formData, setFormData] = useState(profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setSaved(true);
    
    // Auto-redirect after onboarding
    if (showOnboarding) {
      setTimeout(() => navigate('/home'), 1000);
    }
  };

  return (
    <Layout>
      <div className="settings-page">
        <motion.div 
          className="settings-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {showOnboarding && (
            <motion.div 
              className="onboarding-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <span className="onboarding-icon">👋</span>
              <div>
                <strong>Welcome to BillGen!</strong>
                <p>Fill in your profile once, and we'll auto-fill your bills every time.</p>
              </div>
            </motion.div>
          )}
          
          <div className="settings-header">
            <h1>Profile Settings</h1>
            <p>Your personal details will auto-fill bill forms</p>
          </div>
          
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
                <span className="form-hint">Used in all bill templates</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
                <span className="form-hint">For mobile/internet bills</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="driverName">Driver Name</label>
                <input
                  id="driverName"
                  name="driverName"
                  type="text"
                  value={formData.driverName}
                  onChange={handleChange}
                  placeholder="Your driver's name"
                />
                <span className="form-hint">For driver salary receipts</span>
              </div>

              <div className="form-group">
                <label htmlFor="vehicleNumber">Vehicle Number</label>
                <input
                  id="vehicleNumber"
                  name="vehicleNumber"
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="TN04BC8668"
                />
                <span className="form-hint">For driver salary receipts</span>
              </div>
              
              <div className="form-group form-group-full">
                <label htmlFor="address">Address *</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Apartment 4B&#10;City, State - 123456"
                  rows={3}
                  required
                />
                <span className="form-hint">Used as billing/service address</span>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-lg">
                {saved ? (
                  <>
                    <span className="check-icon">✓</span>
                    Saved!
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
              
              {!showOnboarding && (
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => navigate('/home')}
                >
                  Back to Templates
                </button>
              )}
            </div>
          </form>
          
          <div className="settings-note">
            <p>
              <strong>Note:</strong> All data is stored locally on your device. 
              No data is sent to any server.
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Settings;
