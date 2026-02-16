import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAccessStore, useProfileStore } from './context/store';
import { validateEmailAccess } from './utils/accessValidation';

// Components
import AccessGate from './components/AccessGate';

// Pages
import Home from './pages/Home';
import Settings from './pages/Settings';
import Generator from './pages/Generator';

// Styles
import './styles/index.css';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { email, isValidated, isWithinGracePeriod, setAccess, clearAccess } = useAccessStore();
  const navigate = useNavigate();

  useEffect(() => {
    const revalidate = async () => {
      if (!email) {
        navigate('/', { replace: true });
        return;
      }

      // Re-validate on each session
      const result = await validateEmailAccess(email);
      
      if (result.valid === true || result.devMode) {
        setAccess(email);
      } else if (result.valid === false) {
        clearAccess();
        navigate('/', { replace: true });
      } else if (result.error && !isWithinGracePeriod()) {
        // Network error and grace period expired
        clearAccess();
        navigate('/', { replace: true });
      }
    };

    revalidate();
  }, []);

  if (!email || !isValidated) {
    return null; // Will redirect via useEffect
  }

  return children;
};

// Access Denied page
const AccessDenied = () => (
  <div className="access-denied">
    <div className="access-denied-card">
      <span className="icon">🚫</span>
      <h1>Access Revoked</h1>
      <p>&gt; Your access to BillGen has been revoked. Contact admin to get re-added.</p>
      <a href="/" className="btn btn-primary">Try Again</a>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      {/* Cyberpunk animated background */}
      <div className="cyber-grid-bg" />
      <div className="cyber-particles">
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
      </div>
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AccessGate />} />
        <Route path="/denied" element={<AccessDenied />} />
        
        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate/:templateId"
          element={
            <ProtectedRoute>
              <Generator />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
