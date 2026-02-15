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
              <span className="logo-text">Bill<span className="logo-accent">Gen</span></span>
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
      
      <footer className="footer metallic-bg">
        <div className="footer-streak" />
        <div className="footer-content">
          <div className="footer-bars">
            <div className="footer-bar-group">
              <span className="footer-bar-label">MEM</span>
              <div className="footer-bar-track"><div className="footer-bar-fill cyan" style={{width: '45%'}} /></div>
            </div>
            <div className="footer-bar-group">
              <span className="footer-bar-label">CPU</span>
              <div className="footer-bar-track"><div className="footer-bar-fill pink" style={{width: '62%'}} /></div>
            </div>
          </div>
          <p className="footer-text">BillGen — Document Generation System</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
