import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAccessStore } from '../context/store';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, clearAccess } = useAccessStore();
  const [time, setTime] = useState('');
  
  const isActive = (path) => location.pathname === path;
  
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    clearAccess();
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="header metallic-bg">
        <div className="header-streak" />
        
        <div className="header-content">
          <Link to="/home" className="logo">
            <div className="logo-diamond">
              <span className="logo-icon">⚡</span>
            </div>
            <div className="logo-text-group">
              <span className="logo-text">Raven<span className="logo-accent">log</span></span>
              <span className="logo-version">SYS V.1.0 // ONLINE</span>
            </div>
          </Link>
          
          <nav className="nav">
            <Link 
              to="/home" 
              className={`nav-link ${isActive('/home') ? 'active' : ''}`}
            >
              <span className="nav-link-text">Templates</span>
              {isActive('/home') && <div className="nav-active-bar" />}
            </Link>
          </nav>
          
          <div className="header-right">
            <div className="header-time-block">
              <span className="header-time glow-text-cyan">{time}</span>
              <span className="header-time-label">System Clock</span>
            </div>
            <div className="header-divider" />
            <span className="user-email">{email}</span>
            <button className="btn btn-danger btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="main">
        {children}
      </main>

      <footer className="layout-footer-minimal metallic-bg">
        <div className="layout-footer-minimal-streak" />
        <div className="layout-footer-minimal-inner">
          <span className="layout-footer-minimal-left">// Ravenlog v2.0</span>
          <div className="layout-footer-minimal-right">
            <Link to="/terms" className="layout-footer-minimal-link">
              Terms of Service
            </Link>
            <span className="layout-footer-minimal-email">
              {email || '—'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
