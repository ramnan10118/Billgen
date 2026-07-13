import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, PencilSimple } from '@phosphor-icons/react';
import { getAllTemplates, getTemplate } from '../templates/templateConfig';
import TemplateIcon from '../components/TemplateIcon';
import MonthlyDeliveryPopup from '../components/MonthlyDeliveryPopup';
import { useAccessStore } from '../context/store';
import Layout from '../components/Layout';
import './Home.css';

const MONTHLY_POPUP_SEEN_KEY = 'ravenlog-monthly-popup-seen';

const API_URL = import.meta.env.VITE_API_URL || '';

const MONTHS_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const FREQ_LABELS = { once: 'One time', monthly: 'Every month', bimonthly: 'Every 2 months' };

// The next date this schedule delivers, given its frequency + day-of-month.
// Bimonthly lands on even-cadence months only (matches the delivery cron).
function nextDeliveryDate(frequency, deliveryDay, from = new Date()) {
  const day = Math.min(31, Math.max(1, deliveryDay || 1));
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const clampDay = (y, m) => Math.min(day, new Date(y, m + 1, 0).getDate());
  const eligible = (m) => (frequency === 'bimonthly' ? m % 2 === 1 : true);

  let y = from.getFullYear();
  let m = from.getMonth();
  let candidate = new Date(y, m, clampDay(y, m));
  let guard = 0;
  while ((candidate < today || !eligible(m)) && guard < 36) {
    m += 1;
    if (m > 11) { m = 0; y += 1; }
    candidate = new Date(y, m, clampDay(y, m));
    guard += 1;
  }
  return candidate;
}

const SUBMITTED_STORAGE_KEY = 'ravenlog-submitted';
const SUBMITTED_STORAGE_LEGACY = 'billgen-submitted';

function readSubmittedSuggestions() {
  try {
    const next = localStorage.getItem(SUBMITTED_STORAGE_KEY);
    if (next) return JSON.parse(next);
    const legacy = localStorage.getItem(SUBMITTED_STORAGE_LEGACY);
    if (legacy) {
      localStorage.setItem(SUBMITTED_STORAGE_KEY, legacy);
      localStorage.removeItem(SUBMITTED_STORAGE_LEGACY);
      return JSON.parse(legacy);
    }
  } catch {
    /* ignore */
  }
  return [];
}

const SUGGESTION_OPTIONS = [
  'Electricity Bill',
  'Water Bill',
  'Rent Receipt',
  'Cab / Ride Receipt',
  'Restaurant Bill',
  'Medical / Pharmacy Bill',
  'Insurance Receipt',
  'Gym Membership',
];

const submitSuggestion = async (email, suggestion) => {
  try {
    await fetch(`${API_URL}/api/submit-suggestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, suggestion }),
    });
  } catch (error) {
    console.error('Failed to submit suggestion:', error);
  }
};

const Home = () => {
  const navigate = useNavigate();
  const { email: userEmail, tier } = useAccessStore();
  const templates = getAllTemplates(tier);
  const [schedule, setSchedule] = useState(undefined); // undefined = loading, null = none
  const [submitted, setSubmitted] = useState(() => readSubmittedSuggestions());
  const [selected, setSelected] = useState([]);
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!userEmail) { setSchedule(null); return; }
    fetch(`${API_URL}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', email: userEmail }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.found && Array.isArray(d.templates) && d.templates.length) {
          setSchedule({
            frequency: d.frequency || 'monthly',
            deliveryDay: d.deliveryDay || 1,
            templates: d.templates,
          });
        } else {
          setSchedule(null);
        }
      })
      .catch(() => setSchedule(null));
  }, [userEmail]);

  // Educate returning users about auto-delivery — once ever, and only if they
  // haven't already set up a schedule (existing users already know the feature).
  useEffect(() => {
    if (schedule === undefined || schedule) return;
    if (localStorage.getItem(MONTHLY_POPUP_SEEN_KEY)) return;
    setShowPopup(true);
  }, [schedule]);

  const dismissPopup = () => {
    localStorage.setItem(MONTHLY_POPUP_SEEN_KEY, '1');
    setShowPopup(false);
  };

  const activatePopup = () => {
    localStorage.setItem(MONTHLY_POPUP_SEEN_KEY, '1');
    setShowPopup(false);
    navigate('/setup');
  };

  const toggleVote = (option) => {
    if (submitted.includes(option)) return;
    setSelected(prev =>
      prev.includes(option) ? prev.filter(v => v !== option) : [...prev, option]
    );
  };

  const handleSubmitAll = async () => {
    const allSuggestions = [...selected];
    if (customSuggestion.trim()) allSuggestions.push(customSuggestion.trim());
    if (allSuggestions.length === 0) return;

    setSubmitting(true);
    await Promise.all(allSuggestions.map(s => submitSuggestion(userEmail, s)));

    const updatedSubmitted = [...new Set([...submitted, ...allSuggestions])];
    setSubmitted(updatedSubmitted);
    localStorage.setItem(SUBMITTED_STORAGE_KEY, JSON.stringify(updatedSubmitted));
    setSelected([]);
    setCustomSuggestion('');
    setConfirmMsg('Response registered. Thanks!');
    setSubmitting(false);
    setTimeout(() => setConfirmMsg(''), 3000);
  };

  const nextDate = schedule ? nextDeliveryDate(schedule.frequency, schedule.deliveryDay) : null;

  return (
    <Layout>
      <MonthlyDeliveryPopup
        isOpen={showPopup}
        onClose={dismissPopup}
        onActivate={activatePopup}
      />
      <div className="home-page">
        <motion.div
          className="home-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Generate a Bill</h1>
          <p>&gt; Select a template to get started</p>
        </motion.div>

        {schedule === undefined ? null : schedule ? (
          <motion.div
            className="next-delivery"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="nd-date">
              <span className="nd-day">{String(nextDate.getDate()).padStart(2, '0')}</span>
              <span className="nd-month">{MONTHS_ABBR[nextDate.getMonth()]}</span>
              <span className="nd-year">{nextDate.getFullYear()}</span>
            </div>
            <div className="nd-info">
              <span className="nd-label">Next bill delivery</span>
              <ul className="nd-bills">
                {schedule.templates.map((t) => {
                  const tpl = getTemplate(t.templateId);
                  if (!tpl) return null;
                  const splits = Math.max(1, parseInt(t.splits, 10) || 1);
                  return (
                    <li key={t.templateId} className="nd-bill">
                      <span className="nd-bill-icon" style={{ '--accent-color': tpl.color }}>
                        <TemplateIcon templateId={t.templateId} size={18} weight="duotone" />
                      </span>
                      <span className="nd-bill-name">{tpl.name}</span>
                      {splits > 1 && <span className="nd-bill-count">×{splits}</span>}
                    </li>
                  );
                })}
              </ul>
              <div className="nd-foot">
                <span className="nd-freq">{FREQ_LABELS[schedule.frequency] || 'Every month'}</span>
                <Link to="/setup" className="nd-edit">
                  <PencilSimple size={14} weight="bold" /> Edit setup
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="coming-soon-banner"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="cs-title-row">
              <span className="cs-badge cs-badge--live">New</span>
              <h3>Auto-Generate &amp; Email</h3>
            </div>
            <p className="cs-description">
              Set up your details once, pick a monthly budget and schedule, and receive your bills
              auto-generated with fresh dates and IDs — delivered straight to your inbox.
            </p>
            <Link to="/setup" className="btn btn-primary cs-cta">
              Set up monthly bills &gt;
            </Link>
          </motion.div>
        )}
        
        <div className="templates-grid">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 + 0.15 }}
            >
              <Link 
                to={`/generate/${template.id}`}
                className="template-card"
              >
                <div className="template-icon">
                  <TemplateIcon templateId={template.id} size={32} weight="duotone" />
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
                <div className="template-arrow">&gt;</div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="suggest-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3>What should we build next?</h3>
          <p className="suggest-subtitle">Pick the templates you'd like to see, or suggest your own.</p>
          <div className="suggest-grid">
            {SUGGESTION_OPTIONS.map(option => {
              const isSubmitted = submitted.includes(option);
              const isSelected = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={`suggest-chip ${isSubmitted ? 'submitted' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleVote(option)}
                  disabled={isSubmitted}
                >
                  {(isSubmitted || isSelected) && (
                    <Check className="chip-check" size={16} weight="bold" aria-hidden />
                  )}
                  {option}
                </button>
              );
            })}
          </div>
          <div className="suggest-custom">
            <input
              type="text"
              value={customSuggestion}
              onChange={(e) => setCustomSuggestion(e.target.value)}
              placeholder="Something else? Type here..."
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitAll()}
            />
          </div>
          <div className="suggest-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitAll}
              disabled={submitting || (selected.length === 0 && !customSuggestion.trim())}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            {confirmMsg && (
              <motion.span
                className="suggest-confirm"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {confirmMsg}
              </motion.span>
            )}
          </div>
        </motion.div>
        
        <div className="home-footer">
          <p>
            // Templates are pre-designed. Customize parameters on generation.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
