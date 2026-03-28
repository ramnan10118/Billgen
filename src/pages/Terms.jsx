import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import './Terms.css';

const Terms = () => (
  <Layout>
    <div className="terms-page">
      <motion.div
        className="terms-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="terms-header">
          <Link to="/" className="terms-back">
            ← Back
          </Link>
          <h1>Terms of Service</h1>
        </div>

        <section className="terms-section">
          <h2>Permitted Use</h2>
          <p>
            Ravenlog is a document generation tool for personal record-keeping only. You may
            use it to recreate records of transactions you have actually made, for your own reference.
          </p>
        </section>

        <section className="terms-section">
          <h2>Prohibited Use</h2>
          <p>You must not use Ravenlog to:</p>
          <ul>
            <li>
              Submit generated documents as proof of transactions to any employer, tax authority,
              financial institution, or insurance company
            </li>
            <li>Commit fraud, tax evasion, or any form of financial deception</li>
            <li>Impersonate any company, brand, or official entity</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>No Liability</h2>
          <p>
            Ravenlog provides templates as-is. We are not responsible for any misuse of generated
            documents. Full legal liability for any misuse rests with the user.
          </p>
        </section>

        <section className="terms-section">
          <h2>Acknowledgment</h2>
          <p>
            By using Ravenlog and downloading any document, you confirm you have read and
            agree to these terms.
          </p>
        </section>
      </motion.div>
    </div>
  </Layout>
);

export default Terms;
