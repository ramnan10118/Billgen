import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAccessStore } from './context/store';
import { validateEmailAccess } from './utils/accessValidation';

import AccessGate from './components/AccessGate';
import SubscriptionExpired from './components/SubscriptionExpired';
import RenewalBanner from './components/RenewalBanner';

import Home from './pages/Home';
import Settings from './pages/Settings';
import Generator from './pages/Generator';

import './styles/index.css';

const ProtectedRoute = ({ children }) => {
  const {
    email,
    isValidated,
    isWithinGracePeriod,
    setAccess,
    clearAccess,
    isSubscribed,
    downloadsUsed,
    downloadsLimit,
    renewalDue,
    subscribedUntil,
  } = useAccessStore();
  const navigate = useNavigate();

  useEffect(() => {
    const revalidate = async () => {
      if (!email) {
        navigate('/', { replace: true });
        return;
      }

      const result = await validateEmailAccess(email);

      if (result.valid === true) {
        setAccess(email, {
          tier: result.tier,
          downloadsUsed: result.downloadsUsed,
          downloadsLimit: result.downloadsLimit,
          isSubscribed: result.isSubscribed,
          subscribedUntil: result.subscribedUntil,
          daysRemaining: result.daysRemaining,
          renewalDue: result.renewalDue,
        });
      } else if (result.error && !isWithinGracePeriod()) {
        clearAccess();
        navigate('/', { replace: true });
      }
    };

    revalidate();
  }, []);

  if (!email || !isValidated) {
    return null;
  }

  const hasUsedFreeDownloads = downloadsUsed >= downloadsLimit;
  const subscriptionExpired = subscribedUntil && !isSubscribed;

  if (hasUsedFreeDownloads && subscriptionExpired) {
    return <SubscriptionExpired />;
  }

  return (
    <>
      {renewalDue && <RenewalBanner />}
      {children}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/" element={<AccessGate />} />
        
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
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
