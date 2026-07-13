import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from '@phosphor-icons/react';
import './MonthlyDeliveryPopup.css';

const LABEL = '// NEW PROTOCOL';
const HEADLINE = 'Your bills now arrive on their own.';
const GLYPHS = '▓▒░#@&%$§¶ΞΨΩ01<>/\\|=+*';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Typewriter for the small protocol label — types left to right, ~26ms/char.
function useTypewriter(text, active) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setOut(text);
      setDone(true);
      return;
    }
    setOut('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 26);
    return () => clearInterval(id);
  }, [text, active]);

  return { out, done };
}

// Decode/scramble reveal — characters resolve left to right while unsettled
// ones flicker through random glyphs, like a transmission decrypting.
function useScramble(text, active) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    if (prefersReducedMotion()) {
      setOut(text);
      setDone(true);
      return;
    }

    setDone(false);
    const REVEAL_CPS = 26; // characters that lock in per second
    const SCRAMBLE_LEAD = 7; // how many un-settled chars flicker ahead of the edge
    const startedAt = performance.now();

    const tick = (now) => {
      const revealed = ((now - startedAt) / 1000) * REVEAL_CPS;
      let s = '';
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        if (ch === ' ') { s += ' '; continue; }
        if (i < revealed) {
          s += ch;
        } else if (i < revealed + SCRAMBLE_LEAD) {
          s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
      }
      setOut(s);
      if (revealed <= text.length) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setOut(text);
        setDone(true);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, active]);

  return { out, done };
}

const MonthlyDeliveryPopup = ({ isOpen, onClose, onActivate }) => {
  const label = useTypewriter(LABEL, isOpen);
  // Headline decode starts once the label has finished typing.
  const headline = useScramble(HEADLINE, isOpen && label.done);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="mdp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="mdp-modal"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mdp-scanbeam" aria-hidden />

            <button type="button" className="mdp-close" onClick={onClose} aria-label="Close">
              <X size={22} weight="bold" />
            </button>

            <p className="mdp-brand">
              RΛVEN_LOG <span className="mdp-brand-sep">//</span> AUTO DISPATCH
            </p>

            <p className="mdp-label">
              {label.out}
              {!label.done && <span className="mdp-cursor">█</span>}
            </p>

            <h2 className="mdp-headline" aria-label={HEADLINE}>
              {label.done ? headline.out : ''}
              <span className="mdp-headline-caret">_</span>
            </h2>

            <div className="mdp-divider" />

            <p className="mdp-body">
              Set it once. Every month, a full set of records lands in your inbox —
              dated, split, ready to file.
            </p>
            <p className="mdp-tagline">No logins. No reminders. The trace runs itself.</p>

            <button type="button" className="btn btn-primary mdp-cta" onClick={onActivate}>
              ACTIVATE MONTHLY DELIVERY →
            </button>
            <button type="button" className="mdp-dismiss" onClick={onClose}>
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MonthlyDeliveryPopup;
