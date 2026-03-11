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
  const [votes, setVotes] = useState(() => {
    const saved = localStorage.getItem('billgen-votes');
    return saved ? JSON.parse(saved) : [];
  });
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);

  const toggleVote = (option) => {
    const isRemoving = votes.includes(option);
    const updated = isRemoving
      ? votes.filter(v => v !== option)
      : [...votes, option];
    setVotes(updated);
    localStorage.setItem('billgen-votes', JSON.stringify(updated));
    if (!isRemoving) {
      submitSuggestion(userEmail, option);
    }
  };

  const handleCustomSubmit = () => {
    if (!customSuggestion.trim()) return;
    const text = customSuggestion.trim();
    const updated = [...votes, text];
    setVotes(updated);
    localStorage.setItem('billgen-votes', JSON.stringify(updated));
    submitSuggestion(userEmail, text);
    setCustomSuggestion('');
    setSuggestionSent(true);
    setTimeout(() => setSuggestionSent(false), 2000);
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
          <div className="cs-badge">Coming Soon</div>
          <div className="cs-content">
            <h3>Auto-Generate &amp; Email</h3>
            <p>
              Set up your details once, pick a schedule, and receive all your bills 
              auto-generated and delivered straight to your inbox on the date you choose. 
              No more manual downloads.
            </p>
          </div>
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
            {SUGGESTION_OPTIONS.map(option => (
              <button
                key={option}
                type="button"
                className={`suggest-chip ${votes.includes(option) ? 'voted' : ''}`}
                onClick={() => toggleVote(option)}
              >
                {votes.includes(option) && <span className="chip-check">&#10003;</span>}
                {option}
              </button>
            ))}
          </div>
          <div className="suggest-custom">
            <input
              type="text"
              value={customSuggestion}
              onChange={(e) => setCustomSuggestion(e.target.value)}
              placeholder="Something else? Type here..."
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCustomSubmit}
              disabled={!customSuggestion.trim()}
            >
              {suggestionSent ? 'Added!' : 'Submit'}
            </button>
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
