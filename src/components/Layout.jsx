import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfileStore, useAccessStore } from '../context/store';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isProfileComplete } = useProfileStore();
  const { email, clearAccess } = useAccessStore();
  
  const isActive = (path) => location.pathname === path;
  
  const handleLogout = () => {
    clearAccess();
    navigate('/');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/home" className="logo">
            <span className="logo-icon">📄</span>
            <span className="logo-text">BillGen</span>
          </Link>
          
          <nav className="nav">
            <Link 
              to="/home" 
              className={`nav-link ${isActive('/home') ? 'active' : ''}`}
            >
              Templates
            </Link>
            <Link 
              to="/settings" 
              className={`nav-link ${isActive('/settings') ? 'active' : ''}`}
            >
              Settings
              {!isProfileComplete() && <span className="nav-badge">!</span>}
            </Link>
          </nav>
          
          <div className="header-right">
            <span className="user-email">{email}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="main">
        {children}
      </main>
      
      <footer className="footer">
        <p>BillGen — Personal Bill Generator</p>
      </footer>
    </div>
  );
};

export default Layout;
