import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useProfileStore, useTemplateDefaultsStore, useUIStore } from '../context/store';
import { getTemplate } from '../templates/templateConfig';
import { 
  getDatePresets, 
  generateBillNumber, 
  generateAccountNumber, 
  generatePlayoId,
  generateShellTxnId,
  generateBroadbandReceiptNo,
  generateBroadbandOrderNo,
  generatePhonePeTxnId,
  generateUtrNumber,
  formatDate 
} from '../utils/dateHelpers';
import { exportBill } from '../utils/exportUtils';
import { logDownload } from '../utils/downloadLogger';
import { useAccessStore } from '../context/store';
import Layout from '../components/Layout';
import BillPreview from '../components/BillPreview';
import DatePicker from '../components/DatePicker';
import PaywallModal from '../components/PaywallModal';
import AcknowledgmentModal from '../components/AcknowledgmentModal';
import LogoUpload from '../components/LogoUpload';
import './Generator.css';

const LOGO_DIMENSION_HINTS = {
  playo:
    'Top-left slot is up to ~220×72 px (below the banner). Use @2× assets for sharp export; crop tight so the mark fills the frame.',
  petrol:
    'Footer mark matches the receipt logo size: up to ~240×73 px. Crop tight to your symbol—square files with lots of empty border will look small when scaled to fit.',
  broadband:
    'Top-right slot is up to ~200×78 px (same scale as the carrier mark). Crop tight; wide or square padding shrinks the visible logo.',
};

const Generator = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);
  
  const template = getTemplate(templateId);
  const { profile } = useProfileStore();
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

  const autoGenerators = {
    billNumber: generateBillNumber,
    accountNumber: generateAccountNumber,
    playoId: generatePlayoId,
    shellTxnId: generateShellTxnId,
    broadbandReceiptNo: generateBroadbandReceiptNo,
    broadbandOrderNo: generateBroadbandOrderNo,
    phonePeTxnId: generatePhonePeTxnId,
    utrNumber: generateUtrNumber,
  };

  // Initialize form with profile, defaults, and auto-generated values
  useEffect(() => {
    if (!template) return;
    
    const rawDefaults = getDefaults(templateId);
    const savedDefaults = { ...rawDefaults };
    const initialData = {};
    
    template.fields.forEach(field => {
      // Priority: saved defaults > profile data > auto-generated > field default > empty
      if (savedDefaults[field.id]) {
        initialData[field.id] = savedDefaults[field.id];
      } else if (field.profileKey && profile[field.profileKey]) {
        initialData[field.id] = profile[field.profileKey];
      } else if (field.autoGenerate === 'billNumber') {
        initialData[field.id] = generateBillNumber();
      } else if (field.autoGenerate === 'accountNumber') {
        initialData[field.id] = generateAccountNumber();
      } else if (field.autoGenerate === 'playoId') {
        initialData[field.id] = generatePlayoId();
      } else if (field.autoGenerate === 'shellTxnId') {
        initialData[field.id] = generateShellTxnId();
      } else if (field.autoGenerate === 'broadbandReceiptNo') {
        initialData[field.id] = generateBroadbandReceiptNo();
      } else if (field.autoGenerate === 'broadbandOrderNo') {
        initialData[field.id] = generateBroadbandOrderNo();
      } else if (field.autoGenerate === 'phonePeTxnId') {
        initialData[field.id] = generatePhonePeTxnId();
      } else if (field.autoGenerate === 'utrNumber') {
        initialData[field.id] = generateUtrNumber();
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
    
    setFormData(initialData);
  }, [templateId, template, profile]);

  useEffect(() => {
    setLogoUrl(null);
  }, [templateId]);

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

  const handleDatePreset = (fieldId, preset) => {
    if (preset === 'today') {
      handleChange(fieldId, datePresets.today);
    } else if (preset === 'dueDate') {
      handleChange(fieldId, datePresets.defaultDueDate);
    }
  };

  const handlePeriodPreset = (fieldId, preset) => {
    const presetData = preset === 'current' ? datePresets.currentMonth : datePresets.lastMonth;
    handleChange(fieldId, presetData.label);
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

  // Check if a field should be visible based on showWhen condition
  const shouldShowField = (field) => {
    if (!field.showWhen) return true;
    const { field: dependentField, value: expectedValue } = field.showWhen;
    return formData[dependentField] === expectedValue;
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            rows={3}
          />
        );
        
      case 'number':
      case 'currency':
        return (
          <input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.type === 'currency' ? '0.00' : '0'}
            min="0"
            step={field.type === 'currency' ? '0.01' : '1'}
          />
        );
        
      case 'date':
        return (
          <div className="field-with-presets">
            <DatePicker
              value={value}
              onChange={(val) => handleChange(field.id, val)}
            />
            <div className="field-presets">
              <button
                type="button"
                className="preset-btn"
                onClick={() => handleDatePreset(field.id, 'today')}
              >
                Today
              </button>
              {field.id.toLowerCase().includes('due') && (
                <button
                  type="button"
                  className="preset-btn"
                  onClick={() => handleDatePreset(field.id, 'dueDate')}
                >
                  +15 days
                </button>
              )}
            </div>
          </div>
        );
        
      case 'period':
        return (
          <div className="field-with-presets">
            <input
              id={field.id}
              type="text"
              value={value}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder="e.g., January 2024"
            />
            <div className="field-presets">
              <button
                type="button"
                className="preset-btn"
                onClick={() => handlePeriodPreset(field.id, 'last')}
              >
                Last Month
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => handlePeriodPreset(field.id, 'current')}
              >
                This Month
              </button>
            </div>
          </div>
        );
        
      case 'select':
        return (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'toggle':
        return (
          <label className="toggle-field">
            <input
              id={field.id}
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleChange(field.id, e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">{value ? 'Enabled' : 'Disabled'}</span>
          </label>
        );
        
      default:
        if (field.autoGenerate && autoGenerators[field.autoGenerate]) {
          return (
            <div className="field-with-randomize">
              <input
                id={field.id}
                type="text"
                value={value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
              <button
                type="button"
                className="randomize-btn"
                onClick={() => handleChange(field.id, autoGenerators[field.autoGenerate]())}
                title="Randomize"
              >
                🎲
              </button>
            </div>
          );
        }
        return (
          <input
            id={field.id}
            type="text"
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
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
            ← Back to templates
          </Link>
          <div className="header-title">
            <span 
              className="template-icon-badge"
              style={{ '--accent-color': template.color }}
            >
              {template.icon}
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
                {template.fields.map(field => (
                  shouldShowField(field) && (
                    <div key={field.id} className="form-group">
                      <label htmlFor={field.id}>{field.label}</label>
                      {renderField(field)}
                    </div>
                  )
                ))}
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
                  {isExporting ? 'Exporting...' : '📄 Download PDF'}
                </button>
                <button
                  className="btn btn-secondary export-btn"
                  onClick={() => handleExport('png')}
                  disabled={isExporting}
                >
                  🖼️ Download PNG
                </button>
                <button
                  className="btn btn-secondary export-btn"
                  onClick={() => handleExport('jpg')}
                  disabled={isExporting}
                >
                  🖼️ Download JPG
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
