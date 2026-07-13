import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAccessStore } from '../context/store';
import { getTemplate } from '../templates/templateConfig';
import Layout from '../components/Layout';
import './Settings.css';

const API_URL = import.meta.env.VITE_API_URL || '';

const FREQ_LABELS = { once: 'One time', monthly: 'Every month', bimonthly: 'Every 2 months' };

const Settings = () => {
  const navigate = useNavigate();
  const { email, isSubscribed } = useAccessStore();

  // Existing recurring schedule (created in the /setup wizard). Settings views,
  // pauses/resumes, edits, or deletes it.
  const [schedule, setSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch(`${API_URL}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', email }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.found) setSchedule(data);
      })
      .catch(() => {});
  }, [email]);

  const handleToggleSchedule = async () => {
    if (!email || !schedule) return;
    const nextEnabled = !schedule.enabled;
    setScheduleLoading(true);
    try {
      await fetch(`${API_URL}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          email,
          templates: schedule.templates || [],
          deliveryDay: schedule.deliveryDay,
          frequency: schedule.frequency,
          enabled: nextEnabled,
        }),
      });
      setSchedule((s) => ({ ...s, enabled: nextEnabled }));
    } catch { /* silent */ }
    setScheduleLoading(false);
  };

  const handleDeleteSchedule = async () => {
    if (!email) return;
    setResetting(true);
    try {
      await fetch(`${API_URL}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', email }),
      });
      setSchedule(null);
      setConfirmReset(false);
    } catch { /* silent */ }
    setResetting(false);
  };

  const totalBills = (schedule?.templates || []).reduce(
    (sum, t) => sum + Math.max(1, parseInt(t.splits, 10) || 1),
    0
  );

  return (
    <Layout>
      <div className="settings-page">
        <motion.div
          className="settings-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="settings-header">
            <h1>Monthly Bill Delivery</h1>
            <p>Fresh bills auto-generated and emailed to you on schedule</p>
          </div>

          {schedule ? (
            <div className="schedule-form">
              <div className="schedule-summary">
                <div className="schedule-summary-row">
                  <span>Bills</span>
                  <strong>
                    {(schedule.templates || [])
                      .map((t) => {
                        const name = getTemplate(t.templateId)?.name || t.templateId;
                        const splits = Math.max(1, parseInt(t.splits, 10) || 1);
                        return splits > 1 ? `${name} ×${splits}` : name;
                      })
                      .join(', ') || '—'}
                  </strong>
                </div>
                <div className="schedule-summary-row">
                  <span>Bills per delivery</span>
                  <strong>{totalBills}</strong>
                </div>
                <div className="schedule-summary-row">
                  <span>Frequency</span>
                  <strong>{FREQ_LABELS[schedule.frequency] || 'Every month'}</strong>
                </div>
                <div className="schedule-summary-row">
                  <span>Sent on</span>
                  <strong>Day {schedule.deliveryDay}</strong>
                </div>
                <div className="schedule-summary-row">
                  <span>Status</span>
                  <strong className={schedule.enabled ? 'status-on' : 'status-off'}>
                    {schedule.enabled ? 'Active' : 'Paused'}
                  </strong>
                </div>
              </div>

              {!isSubscribed && schedule.enabled && (
                <p className="form-hint schedule-upsell">
                  Delivery activates once you subscribe (₹149/month). Your setup is saved.
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className={schedule.enabled ? 'btn btn-ghost' : 'btn btn-primary'}
                  onClick={handleToggleSchedule}
                  disabled={scheduleLoading}
                >
                  {scheduleLoading
                    ? 'Saving...'
                    : schedule.enabled
                    ? 'Pause delivery'
                    : 'Resume delivery'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/setup')}>
                  Edit setup
                </button>
              </div>

              <div className="schedule-danger">
                {!confirmReset ? (
                  <button type="button" className="btn-reset" onClick={() => setConfirmReset(true)}>
                    Delete setup &amp; start over
                  </button>
                ) : (
                  <div className="schedule-danger-confirm">
                    <p>
                      This permanently deletes your monthly setup — bills, amounts, schedule and all.
                      You&apos;ll start from scratch. This can&apos;t be undone.
                    </p>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleDeleteSchedule}
                        disabled={resetting}
                      >
                        {resetting ? 'Deleting...' : 'Yes, delete everything'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setConfirmReset(false)}
                        disabled={resetting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="schedule-form">
              <p className="form-hint">
                You haven&apos;t set up monthly delivery yet. Pick your bills, a total budget and a
                delivery day — then it runs on autopilot.
              </p>
              <div className="form-actions">
                <button type="button" className="btn btn-primary" onClick={() => navigate('/setup')}>
                  Set up monthly bills
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => navigate('/home')}>
                  Back to Templates
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Settings;
