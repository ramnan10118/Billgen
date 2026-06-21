import { motion } from 'motion/react';
import './Banished.css';

const Banished = () => (
  <div className="banished">
    <div className="banished-bg">
      <div className="banished-grid" />
      <div className="banished-vignette" />
      <div className="banished-scanbeam" />
      <div className="banished-flash" />
    </div>

    <div className="banished-bolts" aria-hidden>
      <div className="bolt bolt-1">⚡</div>
      <div className="bolt bolt-2">⚡</div>
      <div className="bolt bolt-3">⚡</div>
      <div className="bolt bolt-4">⚡</div>
    </div>

    <motion.div
      className="banished-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="banished-icon-wrap" aria-hidden>
        <span className="banished-icon">⚡</span>
        <div className="banished-icon-ring" />
      </div>

      <p className="banished-sys">
        SYS // ACCESS.REVOKE <span className="banished-blink">█</span>
      </p>

      <h1 className="banished-title" data-text="YOU HAVE BEEN BANISHED">
        YOU HAVE BEEN BANISHED
      </h1>

      <div className="banished-divider" />

      <p className="banished-sub">
        Your access to RΛVEN_LOG has been permanently revoked.<br />
        This action was authorized by a system administrator.
      </p>

      <div className="banished-code">
        <span className="banished-code-label">ERR CODE</span>
        <span className="banished-code-val">0x4241_4E4E</span>
      </div>
    </motion.div>
  </div>
);

export default Banished;
