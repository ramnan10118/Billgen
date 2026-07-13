import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  FilePdf,
  FilePng,
  FileJpg,
} from '@phosphor-icons/react';
import { useTemplateDefaultsStore, useUIStore } from '../context/store';
import { nameFromEmail } from '../utils/nameFromEmail';
import { getTemplate } from '../templates/templateConfig';
import { getDatePresets } from '../utils/dateHelpers';
import { AUTO_GENERATORS } from '../utils/recurringBill';
import { exportBill } from '../utils/exportUtils';
import { logDownload } from '../utils/downloadLogger';
import { useAccessStore } from '../context/store';
import Layout from '../components/Layout';
import TemplateIcon from '../components/TemplateIcon';
import BillPreview from '../components/BillPreview';
import BillFieldsForm from '../components/BillFieldsForm';
import PaywallModal from '../components/PaywallModal';
import AcknowledgmentModal from '../components/AcknowledgmentModal';
import LogoUpload from '../components/LogoUpload';
import './Generator.css';

const LOGO_DIMENSION_HINTS = {
  playo: '220 × 72 px',
  petrol: '240 × 73 px',
  broadband: '200 × 78 px',
};

const Generator = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewRef = useRef(null);
  const magicLinkTriggered = useRef(false);
  
  const template = getTemplate(templateId);
  const { getDefaults, saveDefaults } = useTemplateDefaultsStore();
  const { isExporting, setExporting } = useUIStore();
  const {
    email: userEmail,
    tier,
    tier3AckAccepted,
    needsSubscription,
    updateDownloads,
    updateSubscription,
    updateTier3Ack,
  } = useAccessStore();
  
  const [formData, setFormData] = useState({});
  const [logoUrl, setLogoUrl] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAck, setShowAck] = useState(false);
  const [pendingFormat, setPendingFormat] = useState(null);
  const ackBypassed = useRef(false);
  const datePresets = getDatePresets();

  // Initialize form with profile, defaults, and auto-generated values
  useEffect(() => {
    if (!template) return;

    const rawDefaults = getDefaults(templateId);
    const savedDefaults = { ...rawDefaults };
    const initialData = {};

    template.fields.forEach(field => {
      const autoGen = field.autoGenerate && AUTO_GENERATORS[field.autoGenerate];
      // Priority: saved defaults > derived name > auto-generated > field default > empty
      if (savedDefaults[field.id]) {
        initialData[field.id] = savedDefaults[field.id];
      } else if (field.profileKey === 'fullName' && nameFromEmail(userEmail)) {
        initialData[field.id] = nameFromEmail(userEmail);
      } else if (autoGen) {
        initialData[field.id] = autoGen();
      } else if (field.type === 'toggle') {
        initialData[field.id] = field.default !== undefined ? field.default : true;
      } else if (field.default) {
        initialData[field.id] = field.default;
      } else if (field.type === 'date') {
        initialData[field.id] = datePresets.today;
      } else if (field.type === 'period') {
        initialData[field.id] = datePresets.lastMonth.label;
      } else {
        initialData[field.id] = '';
      }
    });
    
    // Magic link: ?data=BASE64URL_JSON overrides defaults. Accept base64url
    // (what the cron now emits) and legacy standard base64 from older links.
    const encoded = searchParams.get('data');
    if (encoded) {
      try {
        const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const overrides = JSON.parse(atob(b64));
        Object.assign(initialData, overrides);
      } catch { /* malformed data param — ignore */ }
    }

    setFormData(initialData);
  }, [templateId, template, userEmail]);

  useEffect(() => {
    setLogoUrl(null);
  }, [templateId]);

  // Auto-download for magic links. Flip the guard only when the download
  // actually fires — arming the timer in the effect body would let StrictMode's
  // dev double-invoke (mount → cleanup → mount) set the guard and cancel the
  // timer before it ever runs, silently disabling auto-download in dev.
  useEffect(() => {
    const encoded = searchParams.get('data');
    if (!encoded || magicLinkTriggered.current) return;
    const timer = setTimeout(() => {
      magicLinkTriggered.current = true;
      handleExport('pdf');
    }, 1800);
    return () => clearTimeout(timer);
  // handleExport is stable within a render; searchParams changes only on URL change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (Number(tier) >= 3) setLogoUrl(null);
  }, [tier]);

  if (!template) {
    return (
      <Layout>
        <div className="generator-not-found">
          <h2>Template not found</h2>
          <p>The template &quot;{templateId}&quot; does not exist.</p>
          <Link to="/home" className="btn btn-primary">Back to Templates</Link>
        </div>
      </Layout>
    );
  }

  if (template.minimumTier && Number(tier) < template.minimumTier) {
    return (
      <Layout>
        <div className="generator-not-found">
          <h2>Not available</h2>
          <p>This template is only available for Tier 3 accounts.</p>
          <Link to="/home" className="btn btn-primary">Back to Templates</Link>
        </div>
      </Layout>
    );
  }

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleExport = async (format) => {
    if (!previewRef.current || isExporting) return;

    if (ackBypassed.current) {
      ackBypassed.current = false;
    } else if (!tier3AckAccepted) {
      setPendingFormat(format);
      setShowAck(true);
      return;
    }

    if (needsSubscription()) {
      setShowPaywall(true);
      return;
    }
    
    saveDefaults(templateId, formData);
    
    const templateClass = {
      driver: '.template-driver',
      upi: '.template-upi',
      playo: '.template-playo',
      petrol: '.template-shell',
      broadband: '.template-broadband',
    }[templateId];
    
    const exportElement = (templateClass && previewRef.current.querySelector(templateClass)) || previewRef.current;
    
    setExporting(true);
    try {
      await exportBill(exportElement, format, template.id, true);
      const result = await logDownload(userEmail, template.name || templateId, format);
      if (result) {
        updateDownloads(result.downloadsUsed, result.requiresSubscription);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleAckConfirm = (sheetOk) => {
    ackBypassed.current = true;
    setShowAck(false);
    if (sheetOk) updateTier3Ack(true);
    const fmt = pendingFormat;
    setPendingFormat(null);
    if (fmt) handleExport(fmt);
  };

  const handleSubscribed = () => {
    setShowPaywall(false);
    updateSubscription({
      isSubscribed: true,
      subscribedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 30,
      renewalDue: false,
    });
  };

  return (
    <Layout>
      <div className="generator-page">
        <motion.div 
          className="generator-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/home" className="back-link">
            <ArrowLeft size={18} weight="bold" className="back-link-icon" aria-hidden />
            Back to templates
          </Link>
          <div className="header-title">
            <span
              className="template-icon-badge"
              style={{ '--accent-color': template.color }}
            >
              <TemplateIcon templateId={template.id} size={26} weight="duotone" />
            </span>
            <h1>{template.name}</h1>
          </div>
        </motion.div>
        
        <div className="generator-content">
          <motion.div 
            className="generator-form-panel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="form-section">
              <h3>Bill Details</h3>
              <form className="generator-form">
                <BillFieldsForm
                  fields={template.fields}
                  values={formData}
                  onChange={handleChange}
                  tier={tier}
                />
              </form>
            </div>

            {templateId !== 'driver' && templateId !== 'upi' && Number(tier) < 3 && (
              <div className="logo-section">
                <h3>Business logo</h3>
                <LogoUpload
                  value={logoUrl}
                  onChange={setLogoUrl}
                  dimensionHint={LOGO_DIMENSION_HINTS[templateId]}
                />
              </div>
            )}
            
            <div className="export-section">
              <h3>Export</h3>
              <div className="export-buttons">
                <button
                  className="btn btn-primary export-btn"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    'Exporting...'
                  ) : (
                    <>
                      <FilePdf size={20} weight="duotone" className="export-btn-icon" aria-hidden />
                      Download PDF
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary export-btn"
                  onClick={() => handleExport('png')}
                  disabled={isExporting}
                >
                  <FilePng size={20} weight="duotone" className="export-btn-icon" aria-hidden />
                  Download PNG
                </button>
                <button
                  className="btn btn-secondary export-btn"
                  onClick={() => handleExport('jpg')}
                  disabled={isExporting}
                >
                  <FileJpg size={20} weight="duotone" className="export-btn-icon" aria-hidden />
                  Download JPG
                </button>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="generator-preview-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="preview-header">
              <h3>Live Preview</h3>
              <span className="preview-hint">Updates as you type</span>
            </div>
            <div className={`preview-container ${templateId === 'upi' ? 'preview-upi' : ''}`}>
              <div className={`preview-wrapper ${templateId === 'upi' ? 'preview-wrapper-upi' : ''}`} ref={previewRef}>
                <BillPreview 
                  templateId={templateId}
                  data={formData}
                  tier={tier}
                  logoUrl={
                    templateId === 'driver' ||
                    templateId === 'upi' ||
                    Number(tier) >= 3
                      ? null
                      : logoUrl
                  }
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribed={handleSubscribed}
      />

      <AcknowledgmentModal
        isOpen={showAck}
        email={userEmail}
        templateId={templateId}
        onConfirm={handleAckConfirm}
        onClose={() => {
          setShowAck(false);
          setPendingFormat(null);
        }}
      />
    </Layout>
  );
};

export default Generator;
