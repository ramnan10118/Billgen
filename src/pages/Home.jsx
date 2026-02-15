import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useProfileStore } from '../context/store';
import { getAllTemplates } from '../templates/templateConfig';
import Layout from '../components/Layout';
import './Home.css';

const Home = () => {
  const templates = getAllTemplates();
  const { isProfileComplete } = useProfileStore();

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
        
        {!isProfileComplete() && (
          <motion.div 
            className="profile-nudge"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="nudge-icon">⚠</span>
            <div className="nudge-content">
              <strong>Profile Incomplete</strong>
              <p>Configure your profile to auto-fill bill data</p>
            </div>
            <Link to="/settings" className="btn btn-danger btn-sm">
              Configure
            </Link>
          </motion.div>
        )}
        
        <div className="templates-grid">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
