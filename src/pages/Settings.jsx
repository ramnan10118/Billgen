import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { HandWaving, Check } from '@phosphor-icons/react';
import { useProfileStore, useAccessStore, useTemplateDefaultsStore } from '../context/store';
import { getAllTemplates } from '../templates/templateConfig';
import Layout from '../components/Layout';
import './Settings.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, updateProfile, isProfileComplete } = useProfileStore();
  const { email, tier, isSubscribed } = useAccessStore();
  const { getDefaults } = useTemplateDefaultsStore();
  const templates = getAllTemplates(tier);

  const showOnboarding = location.state?.showOnboarding && !isProfileComplete();

  const [formData, setFormData] = useState(profile);
  const [saved, setSaved] = useState(false);

  const [schedule, setSchedule] = useState({
    enabled: false,
    templateId: templates[0]?.id || '',
    deliveryDay: 1,
  });
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch(`${API_URL}/api/get-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.found) {
          setSchedule({
            enabled: data.enabled,
            templateId: data.templateId || templates[0]?.id || '',
            deliveryDay: data.deliveryDay || 1,
          });
        }
      })
      .catch(() => {});
  }, [email]);

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
    if (showOnboarding) {
      setTimeout(() => navigate('/home'), 1000);
    }
  };

  const handleScheduleSave = async () => {
    if (!email) return;
    setScheduleLoading(true);
    setScheduleSaved(false);
    try {
      const fieldData = getDefaults(schedule.templateId);
      await fetch(`${API_URL}/api/save-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          templateId: schedule.templateId,
          fieldData: JSON.stringify(fieldData),
          deliveryDay: schedule.deliveryDay,
          enabled: schedule.enabled,
        }),
      });
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 3000);
    } catch { /* silent */ }
    setScheduleLoading(false);
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
              <span className="onboarding-icon" aria-hidden>
                <HandWaving size={28} weight="duotone" />
              </span>
              <div>
                <strong>Welcome to Ravenlog!</strong>
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
                    <Check className="check-icon" size={18} weight="bold" aria-hidden />
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
              <strong>Note:</strong> Profile data is stored locally on your device.
            </p>
          </div>

          {isSubscribed && (
            <div className="settings-section">
              <div className="settings-header">
                <h1>Monthly Bill Delivery</h1>
                <p>Get a pre-filled bill emailed to you every month</p>
              </div>

              <div className="schedule-form">
                <div className="form-group schedule-toggle-row">
                  <label className="toggle-label">
                    <span>Enable monthly delivery</span>
                    <button
                      type="button"
                      className={`toggle-btn ${schedule.enabled ? 'toggle-btn--on' : ''}`}
                      onClick={() => setSchedule((s) => ({ ...s, enabled: !s.enabled }))}
                      aria-pressed={schedule.enabled}
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </label>
                </div>

                {schedule.enabled && (
                  <>
                    <div className="form-group">
                      <label htmlFor="scheduleTemplate">Template to send</label>
                      <select
                        id="scheduleTemplate"
                        value={schedule.templateId}
                        onChange={(e) => setSchedule((s) => ({ ...s, templateId: e.target.value }))}
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <span className="form-hint">
                        Uses the last values you filled in for this template
                      </span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="deliveryDay">Day of month to send</label>
                      <input
                        id="deliveryDay"
                        type="number"
                        min="1"
                        max="28"
                        value={schedule.deliveryDay}
                        onChange={(e) =>
                          setSchedule((s) => ({
                            ...s,
                            deliveryDay: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
                          }))
                        }
                      />
                      <span className="form-hint">1–28 (max 28 to work every month)</span>
                    </div>
                  </>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleScheduleSave}
                    disabled={scheduleLoading}
                  >
                    {scheduleSaved ? (
                      <><Check size={18} weight="bold" /> Saved!</>
                    ) : scheduleLoading ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Settings;
