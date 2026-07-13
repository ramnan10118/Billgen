import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAccessStore } from './context/store';
import { validateSessionByGoogleId } from './utils/accessValidation';

import AccessGate from './components/AccessGate';
import Banished from './components/Banished';
import SubscriptionExpired from './components/SubscriptionExpired';
import RenewalBanner from './components/RenewalBanner';

import Home from './pages/Home';
import Settings from './pages/Settings';
import Generator from './pages/Generator';
import SetupWizard from './pages/SetupWizard';
import DownloadBills from './pages/DownloadBills';
import Terms from './pages/Terms';

import './styles/index.css';

const ProtectedRoute = ({ children }) => {
  const {
    email,
    googleId,
    isValidated,
    setAccess,
    clearAccess,
    isSubscribed,
    downloadsUsed,
    downloadsLimit,
    renewalDue,
    subscribedUntil,
  } = useAccessStore();
  const navigate = useNavigate();
  const [storeReady, setStoreReady] = useState(() => useAccessStore.persist.hasHydrated());
  const [banished, setBanished] = useState(false);

  useEffect(() => {
    if (useAccessStore.persist.hasHydrated()) return undefined;
    return useAccessStore.persist.onFinishHydration(() => setStoreReady(true));
  }, []);

  useEffect(() => {
    if (!storeReady) return;

    const revalidate = async () => {
      if (!email || !googleId) {
        clearAccess();
        navigate('/', { replace: true });
        return;
      }

      const result = await validateSessionByGoogleId(googleId);

      if (result.banned) {
        setBanished(true);
      } else if (result.valid === true && result.email) {
        setAccess(result.email, {
          googleId: result.googleId ?? googleId,
          tier: result.tier,
          downloadsUsed: result.downloadsUsed,
          downloadsLimit: result.downloadsLimit,
          isSubscribed: result.isSubscribed,
          subscribedUntil: result.subscribedUntil,
          daysRemaining: result.daysRemaining,
          renewalDue: result.renewalDue,
          tier3AckAccepted: result.tier3AckAccepted,
        });
      } else if (result.error || result.valid === false) {
        clearAccess();
        navigate('/', { replace: true });
      }
    };

    revalidate();
    // Intentionally run once after persist hydration — avoid re-running on every email/googleId change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + storeReady gate only
  }, [storeReady]);

  if (banished) return <Banished />;

  if (!storeReady || !email || !googleId || !isValidated) {
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
        <Route path="/terms" element={<Terms />} />
        <Route path="/download" element={<DownloadBills />} />

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
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <SetupWizard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
