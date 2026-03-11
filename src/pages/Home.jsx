import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { getAllTemplates } from '../templates/templateConfig';
import { useAccessStore } from '../context/store';
import Layout from '../components/Layout';
import './Home.css';

const API_URL = import.meta.env.VITE_API_URL || '';

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
  const templates = getAllTemplates();
  const { email: userEmail } = useAccessStore();
  const [submitted, setSubmitted] = useState(() => {
    const saved = localStorage.getItem('billgen-submitted');
    return saved ? JSON.parse(saved) : [];
  });
  const [selected, setSelected] = useState([]);
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');

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
    localStorage.setItem('billgen-submitted', JSON.stringify(updatedSubmitted));
    setSelected([]);
    setCustomSuggestion('');
    setConfirmMsg('Response registered. Thanks!');
    setSubmitting(false);
    setTimeout(() => setConfirmMsg(''), 3000);
  };

  return (
    <Layout>
      <div className="home-page">
        <motion.div 
          className="home-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Generate a Bill</h1>
          <p>&gt; Select a template to get started</p>
        </motion.div>

        <motion.div
          className="coming-soon-banner"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="cs-title-row">
            <span className="cs-badge">Coming Soon</span>
            <h3>Auto-Generate &amp; Email</h3>
          </div>
          <p className="cs-description">
            Set up your details once, pick a schedule, and receive all your bills 
            auto-generated and delivered straight to your inbox. No more manual downloads.
          </p>
        </motion.div>
        
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
                  {template.icon}
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
                  {(isSubmitted || isSelected) && <span className="chip-check">&#10003;</span>}
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
