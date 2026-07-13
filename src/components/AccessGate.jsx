import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useGoogleOAuth } from '@react-oauth/google';

const M = {
  h1: motion.h1,
  span: motion.span,
  p: motion.p,
  div: motion.div,
  button: motion.button,
};

import { useAccessStore } from '../context/store';
import { validateGoogleCredential } from '../utils/accessValidation';
import Banished from './Banished';
import googleSignInPill from '../../signin-assets/web_dark_rd_SI.svg?url';
import './AccessGate.css';

/** Native asset size from Google branding SVG (175×40) */
const GOOGLE_PILL_W = 175;
const GOOGLE_PILL_H = 40;

const AccessGate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [banished, setBanished] = useState(false);

  const navigate = useNavigate();
  const { setAccess } = useAccessStore();
  const { scriptLoadedSuccessfully } = useGoogleOAuth();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const onSuccessRef = useRef(null);
  const gsiHostRef = useRef(null);

  const handleGoogleSuccess = useCallback(
    async (credentialResponse) => {
      const credential = credentialResponse.credential;
      if (!credential) {
        setError('No credential returned from Google');
        return;
      }

      setError('');
      setIsLoading(true);

      try {
        const result = await validateGoogleCredential(credential);

        if (result.banned) {
          setBanished(true);
        } else if (result.valid === true && result.email) {
          setAccess(result.email, {
            googleId: result.googleId,
            tier: result.tier,
            downloadsUsed: result.downloadsUsed,
            downloadsLimit: result.downloadsLimit,
            isSubscribed: result.isSubscribed,
            subscribedUntil: result.subscribedUntil,
            daysRemaining: result.daysRemaining,
            renewalDue: result.renewalDue,
            tier3AckAccepted: result.tier3AckAccepted,
          });
          navigate('/home');
        } else if (result.error) {
          setError('Unable to verify access. Please check your connection and try again.');
        } else {
          setError('Access could not be verified. Please try again.');
        }
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, setAccess]
  );

  onSuccessRef.current = handleGoogleSuccess;

  useEffect(() => {
    if (!clientId || !scriptLoadedSuccessfully) return;
    const id = window.google?.accounts?.id;
    if (!id) return;

    id.initialize({
      client_id: clientId,
      callback: (credentialResponse) => {
        if (!credentialResponse?.credential) {
          setError('Google sign-in was cancelled or failed. Please try again.');
          return;
        }
        onSuccessRef.current?.({
          credential: credentialResponse.credential,
          clientId: credentialResponse.clientId,
          select_by: credentialResponse.select_by,
        });
      },
      cancel_on_tap_outside: true,
    });

    return () => {
      id.cancel();
    };
  }, [clientId, scriptLoadedSuccessfully]);

  // Render the real Google button into an invisible overlay sitting on top of
  // the custom pill. Clicking the pill actually clicks this button, which opens
  // the centered account-chooser popup fast (no One Tap pre-flight / top-right
  // card) and fires the same initialize() callback with the credential JWT.
  useEffect(() => {
    if (!scriptLoadedSuccessfully || !clientId) return;
    const host = gsiHostRef.current;
    const id = window.google?.accounts?.id;
    if (!host || !id) return;

    id.renderButton(host, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: GOOGLE_PILL_W,
      logo_alignment: 'left',
    });

    return () => {
      host.replaceChildren();
    };
  }, [scriptLoadedSuccessfully, clientId]);

  if (banished) return <Banished />;

  return (
    <div className="access-gate">
      <div className="access-background">
        <div className="access-gradient" />
        <div className="access-grid" />
      </div>

      <div className="access-card">
        <div className="access-header">
          <div className="access-logo-diamond">
            <span className="access-logo-icon">⚡</span>
          </div>
          <M.h1
            className="access-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Raven<span className="access-title-accent">log</span>
          </M.h1>
          <M.span
            className="access-version"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            SYS V.2.0 // ONLINE
          </M.span>
          <M.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.3 }}
          >
            Professional bills and receipts.
          </M.p>
        </div>

        <M.div
          className="access-form access-google-block"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
        >
          {!clientId && (
            <p className="access-config-missing">
              Missing VITE_GOOGLE_CLIENT_ID — add it to your environment to enable sign-in.
            </p>
          )}

          {error && (
            <M.div
              className="error-message"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              {error}
            </M.div>
          )}

          <div className={`access-google-wrap ${isLoading ? 'access-google-wrap--loading' : ''}`}>
            {isLoading && (
              <div className="access-google-loading" aria-hidden>
                <span className="spinner" />
                <span className="access-google-loading-text">Verifying...</span>
              </div>
            )}
            {clientId && (
              <div
                className={`access-google-pill ${isLoading ? 'access-google-pill--loading' : ''}`}
              >
                <img
                  className="access-google-pill-img"
                  src={googleSignInPill}
                  alt="Sign in with Google"
                  width={GOOGLE_PILL_W}
                  height={GOOGLE_PILL_H}
                  draggable={false}
                />
                {/* Invisible real Google button on top — captures the click and
                    opens the centered account-chooser popup. */}
                <div ref={gsiHostRef} className="access-google-gsi-overlay" />
              </div>
            )}
          </div>
        </M.div>
      </div>
    </div>
  );
};

export default AccessGate;
