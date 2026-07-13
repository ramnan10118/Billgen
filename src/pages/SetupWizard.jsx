import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ArrowLeft, ArrowRight, Lightning, CalendarBlank } from '@phosphor-icons/react';
import { useAccessStore, useTemplateDefaultsStore } from '../context/store';
import { nameFromEmail } from '../utils/nameFromEmail';
import { getAllTemplates, getTemplate } from '../templates/templateConfig';
import {
  getEngineOwnedFieldIds,
  getAmountOwnedFieldIds,
  getConstantFieldIds,
  generateMonthlyBills,
  billDateRange,
} from '../utils/recurringBill';
import { getDatePresets } from '../utils/dateHelpers';
import { startSubscription } from '../utils/subscribe';
import Layout from '../components/Layout';
import TemplateIcon from '../components/TemplateIcon';
import BillFieldsForm from '../components/BillFieldsForm';
import BillPreview from '../components/BillPreview';
import './SetupWizard.css';

const API_URL = import.meta.env.VITE_API_URL || '';
const STEPS = ['Amount', 'Details', 'Launch'];
const FREQUENCIES = [
  { id: 'monthly', label: 'Every month', note: 'Fresh bills emailed each month.' },
  { id: 'bimonthly', label: 'Every 2 months', note: 'Fresh bills every second month.' },
];

// Fields the setup hides from the details step: dates/IDs (regenerated per bill)
// and amount fields (driven by the total you enter).
function detailHiddenFields(templateId) {
  return [
    ...getEngineOwnedFieldIds(templateId),
    ...getAmountOwnedFieldIds(templateId),
    ...getConstantFieldIds(templateId),
  ];
}

// Seed a template's static fields from profile + saved defaults, mirroring the
// Generator's priority (saved defaults > profile > field default).
function seedFields(templateId, profileValues, getDefaults) {
  const template = getTemplate(templateId);
  if (!template) return {};
  const datePresets = getDatePresets();
  const saved = getDefaults(templateId) || {};
  const data = {};
  template.fields.forEach((field) => {
    if (saved[field.id] !== undefined && saved[field.id] !== '') {
      data[field.id] = saved[field.id];
    } else if (field.profileKey && profileValues[field.profileKey]) {
      data[field.id] = profileValues[field.profileKey];
    } else if (field.type === 'toggle') {
      data[field.id] = field.default !== undefined ? field.default : true;
    } else if (field.default) {
      data[field.id] = field.default;
    } else if (field.type === 'date') {
      data[field.id] = datePresets.today;
    } else if (field.type === 'period') {
      data[field.id] = datePresets.lastMonth.label;
    } else {
      data[field.id] = '';
    }
  });
  return data;
}

// Required fields (visible dropdowns with no value) that block progress.
function getMissingRequired(template, values, hiddenFieldIds) {
  const isVisible = (f) => {
    if (hiddenFieldIds.includes(f.id)) return false;
    if (!f.showWhen) return true;
    return values[f.showWhen.field] === f.showWhen.value;
  };
  return template.fields.filter(
    (f) => f.type === 'select' && isVisible(f) && (values[f.id] === undefined || values[f.id] === '')
  );
}

const SetupWizard = () => {
  const navigate = useNavigate();
  const { email, tier, isSubscribed, updateSubscription } = useAccessStore();
  const { getDefaults } = useTemplateDefaultsStore();
  const templates = getAllTemplates(tier);
  // Only reusable pre-fill left is the user's name, derived from their email.
  const profileValues = useMemo(() => ({ fullName: nameFromEmail(email) }), [email]);

  const [step, setStep] = useState(0);
  const [frequency, setFrequency] = useState('monthly');
  const [deliveryDay, setDeliveryDay] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [amountByTemplate, setAmountByTemplate] = useState({}); // { id: { total, splits } }
  const [detailsByTemplate, setDetailsByTemplate] = useState({});
  const [detailIndex, setDetailIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState('');

  // Load an existing schedule so the wizard doubles as "edit setup".
  useEffect(() => {
    if (!email) return;
    fetch(`${API_URL}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', email }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.found && Array.isArray(data.templates) && data.templates.length) {
          const ids = [];
          const details = {};
          const amounts = {};
          data.templates.forEach((t) => {
            if (!getTemplate(t.templateId)) return;
            ids.push(t.templateId);
            details[t.templateId] = {
              ...seedFields(t.templateId, profileValues, getDefaults),
              ...(t.fieldData || {}),
            };
            amounts[t.templateId] = {
              total: t.total ? String(t.total) : '',
              splits: t.splits || 1,
            };
          });
          setSelectedIds(ids);
          setDetailsByTemplate(details);
          setAmountByTemplate(amounts);
          setDeliveryDay(data.deliveryDay || 1);
          setFrequency(data.frequency || 'monthly');
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const toggleTemplate = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      setDetailsByTemplate((d) => (d[id] ? d : { ...d, [id]: seedFields(id, profileValues, getDefaults) }));
      setAmountByTemplate((a) => (a[id] ? a : { ...a, [id]: { total: '', splits: 1 } }));
      return [...prev, id];
    });
  };

  const updateAmount = (id, key, value) => {
    setAmountByTemplate((a) => ({ ...a, [id]: { ...a[id], [key]: value } }));
  };

  const updateDetail = (templateId, fieldId, value) => {
    setDetailsByTemplate((d) => ({
      ...d,
      [templateId]: { ...d[templateId], [fieldId]: value },
    }));
  };

  // Live example of the date window, referenced to the NEXT delivery date so it
  // always shows the upcoming cycle (rolls to next month if this month's day
  // has already passed).
  const cycle = useMemo(() => {
    const now = new Date();
    const day = Math.min(31, Math.max(1, deliveryDay || 1));
    const lastOf = (y, m) => new Date(y, m + 1, 0).getDate();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let ref = new Date(now.getFullYear(), now.getMonth(), Math.min(day, lastOf(now.getFullYear(), now.getMonth())));
    if (ref < todayStart) {
      const m = now.getMonth() + 1;
      ref = new Date(now.getFullYear(), m, Math.min(day, lastOf(now.getFullYear(), m)));
    }
    const { start, end } = billDateRange(frequency, deliveryDay, ref);
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return {
      start: fmt(start),
      end: fmt(end),
      earlierMonth: start.toLocaleDateString('en-IN', { month: 'long' }),
    };
  }, [frequency, deliveryDay]);

  // Live sample bill for the details step's preview pane.
  const sample = useMemo(() => {
    const id = selectedIds[detailIndex];
    if (!id) return null;
    const amt = amountByTemplate[id] || {};
    try {
      const [bill] = generateMonthlyBills(id, detailsByTemplate[id] || {}, {
        monthlyTarget: Number(amt.total) || 0,
        splitCount: Math.max(1, parseInt(amt.splits, 10) || 1),
      });
      return bill || detailsByTemplate[id] || {};
    } catch {
      return detailsByTemplate[id] || {};
    }
  }, [selectedIds, detailIndex, amountByTemplate, detailsByTemplate]);

  const handleSubscribe = () => {
    if (!email) return;
    setSubscribing(true);
    setSubError('');
    startSubscription({
      email,
      onSuccess: (result) => {
        updateSubscription({
          isSubscribed: true,
          subscribedUntil: result.subscribedUntil,
          daysRemaining: 30,
          renewalDue: false,
        });
        setSubscribing(false);
      },
      onError: (msg) => {
        setSubError(msg);
        setSubscribing(false);
      },
      onDismiss: () => setSubscribing(false),
    });
  };

  const handleActivate = async () => {
    if (!email) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          email,
          frequency,
          deliveryDay,
          enabled: true,
          templates: selectedIds.map((id) => ({
            templateId: id,
            fieldData: detailsByTemplate[id] || {},
            total: Number(amountByTemplate[id]?.total) || 0,
            splits: Math.max(1, parseInt(amountByTemplate[id]?.splits, 10) || 1),
          })),
        }),
      });
      setDone(true);
    } catch {
      /* surfaced via button state */
    }
    setSaving(false);
  };

  // --- Validation -----------------------------------------------------------
  const amountsValid = selectedIds.every((id) => {
    const a = amountByTemplate[id] || {};
    return Number(a.total) > 0 && Math.max(1, parseInt(a.splits, 10) || 1) >= 1;
  });

  const currentId = selectedIds[detailIndex];
  const currentTpl = currentId ? getTemplate(currentId) : null;
  const currentMissing = currentTpl
    ? getMissingRequired(currentTpl, detailsByTemplate[currentId] || {}, detailHiddenFields(currentId))
    : [];

  const canNext =
    step === 0
      ? selectedIds.length > 0 && amountsValid && deliveryDay >= 1 && deliveryDay <= 31
      : step === 1
        ? currentMissing.length === 0
        : true;

  const goNext = () => {
    if (step === 1 && detailIndex < selectedIds.length - 1) {
      setDetailIndex(detailIndex + 1);
      return;
    }
    if (step === 0) setDetailIndex(0);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 1 && detailIndex > 0) {
      setDetailIndex(detailIndex - 1);
      return;
    }
    setStep((s) => s - 1);
  };

  const totalBillCount = selectedIds.reduce(
    (sum, id) => sum + Math.max(1, parseInt(amountByTemplate[id]?.splits, 10) || 1),
    0
  );
  const freqLabel = FREQUENCIES.find((f) => f.id === frequency)?.label || '';

  // --- Done screen ----------------------------------------------------------
  if (done) {
    return (
      <Layout>
        <div className="wizard-page wizard-page--narrow">
          <motion.div
            className="wizard-card wizard-done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="wizard-done-icon" aria-hidden>
              <Lightning size={40} weight="duotone" />
            </span>
            <h1>It&apos;s in motion.</h1>
            <p>
              {totalBillCount} bill{totalBillCount > 1 ? 's' : ''} will be generated fresh and emailed
              to <strong>{email}</strong> on day {deliveryDay},{' '}
              {frequency === 'once' ? 'one time' : freqLabel.toLowerCase()}.
            </p>
            {!isSubscribed && (
              <div className="wizard-upsell">
                <strong>One step left:</strong> delivery activates once you subscribe (₹149/month).
                Your setup is saved and waiting.
                {subError && <div className="wizard-upsell-error">{subError}</div>}
                <button
                  className="btn btn-primary wizard-upsell-btn"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <>
                      <span className="spinner" /> Processing...
                    </>
                  ) : (
                    'Subscribe now — ₹149/month'
                  )}
                </button>
              </div>
            )}
            <div className="wizard-actions">
              <button className="btn btn-ghost" onClick={() => navigate('/home')}>
                Back to Templates
              </button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const wide = step === 1; // details step uses the two-pane wide layout

  return (
    <Layout>
      <div className={`wizard-page ${wide ? '' : 'wizard-page--narrow'}`}>
        <motion.div
          className="wizard-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="wizard-header">
            <h1>Automate your monthly bills</h1>
            <p>Set the amount and how often. Fresh dates and IDs, generated for you every time.</p>
          </div>

          <div className="wizard-steps">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`wizard-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              >
                <span className="wizard-step-num">
                  {i < step ? <Check size={14} weight="bold" /> : i + 1}
                </span>
                <span className="wizard-step-label">{label}</span>
              </div>
            ))}
          </div>

          {/* Step 1 — Amount & frequency */}
          {step === 0 && (
            <div className="wizard-body">
              <div className="wizard-field-block">
                <label className="wizard-block-label">How often?</label>
                <div className="wizard-segment" role="radiogroup" aria-label="How often">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={frequency === f.id}
                      className={`wizard-segment-btn ${frequency === f.id ? 'active' : ''}`}
                      onClick={() => setFrequency(f.id)}
                    >
                      <span className="wizard-radio" aria-hidden />
                      <span className="wizard-segment-text">
                        <strong>{f.label}</strong>
                        <span>{f.note}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="wizard-field-block">
                <label className="wizard-block-label" htmlFor="deliveryDay">
                  Email me on day
                </label>
                <input
                  id="deliveryDay"
                  className="wizard-day-input"
                  type="number"
                  min="1"
                  max="31"
                  value={deliveryDay}
                  onChange={(e) =>
                    setDeliveryDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                />
                <span className="form-hint">
                  1–31. Bills arrive on this day{' '}
                  {frequency === 'bimonthly' ? 'every 2 months' : 'every month'}.
                </span>
              </div>

              <div className="wizard-date-note">
                <CalendarBlank size={18} weight="duotone" />
                <span>
                  Each bill gets a random <strong>weekday</strong> date between{' '}
                  <strong>{cycle.start}</strong> and <strong>{cycle.end}</strong> — most landing in{' '}
                  <strong>{cycle.earlierMonth}</strong>, since it has more days in the range.
                </span>
              </div>

              <div className="wizard-field-block">
                <label className="wizard-block-label">Which bills?</label>
                <p className="wizard-hint">
                  Pick each bill type, then set the total to spend and how many bills to split it into.
                </p>
                <div className="wizard-billtypes">
                  {templates.map((t) => {
                    const on = selectedIds.includes(t.id);
                    const amt = amountByTemplate[t.id] || { total: '', splits: 1 };
                    return (
                      <div key={t.id} className={`wizard-billtype ${on ? 'on' : ''}`}>
                        <button
                          type="button"
                          className="wizard-billtype-head"
                          onClick={() => toggleTemplate(t.id)}
                          aria-pressed={on}
                        >
                          <span className="wizard-template-check">
                            {on && <Check size={14} weight="bold" />}
                          </span>
                          <span
                            className="wizard-template-icon"
                            style={{ '--accent-color': t.color }}
                          >
                            <TemplateIcon templateId={t.id} size={24} weight="duotone" />
                          </span>
                          <span className="wizard-template-info">
                            <strong>{t.name}</strong>
                          </span>
                        </button>

                        {on && (
                          <div className="wizard-billtype-amount">
                            <div className="wizard-amount-field">
                              <label htmlFor={`total-${t.id}`}>Total amount (₹)</label>
                              <input
                                id={`total-${t.id}`}
                                type="number"
                                min="0"
                                inputMode="numeric"
                                placeholder="10000"
                                value={amt.total}
                                onChange={(e) => updateAmount(t.id, 'total', e.target.value)}
                              />
                            </div>
                            <div className="wizard-amount-field">
                              <label htmlFor={`splits-${t.id}`}>Split into</label>
                              <div className="wizard-splits-input">
                                <input
                                  id={`splits-${t.id}`}
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={amt.splits}
                                  onChange={(e) =>
                                    updateAmount(
                                      t.id,
                                      'splits',
                                      Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                                    )
                                  }
                                />
                                <span>bill{Number(amt.splits) > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Details (two-pane, one bill at a time) */}
          {step === 1 && currentTpl && (
            <div className="wizard-body">
              {selectedIds.length > 1 && (
                <div className="wizard-detail-tabs">
                  {selectedIds.map((id, idx) => (
                    <button
                      key={id}
                      type="button"
                      className={`wizard-detail-tab ${idx === detailIndex ? 'active' : ''}`}
                      onClick={() => setDetailIndex(idx)}
                    >
                      {getTemplate(id)?.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="wizard-twopane">
                <div className="wizard-pane-form">
                  <p className="wizard-hint">
                    Fill the details that stay the same each bill. Dates, IDs and amounts are handled
                    for you.
                  </p>
                  {currentMissing.length > 0 && (
                    <div className="wizard-missing">
                      Please choose: {currentMissing.map((f) => f.label).join(', ')}
                    </div>
                  )}
                  <form className="generator-form">
                    <BillFieldsForm
                      fields={currentTpl.fields}
                      values={detailsByTemplate[currentId] || {}}
                      onChange={(fid, val) => updateDetail(currentId, fid, val)}
                      tier={tier}
                      hiddenFieldIds={detailHiddenFields(currentId)}
                    />
                  </form>
                </div>

                <div className="wizard-pane-preview">
                  <div className="wizard-sample-head">
                    <span className="wizard-sample-label">Sample Bill</span>
                    <span className="wizard-sample-sub">
                      1 of {Math.max(1, parseInt(amountByTemplate[currentId]?.splits, 10) || 1)}
                    </span>
                  </div>
                  <div className="wizard-sample-frame">
                    <BillPreview templateId={currentId} data={sample || {}} tier={3} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Launch / confirm */}
          {step === 2 && (
            <div className="wizard-body">
              <div className="wizard-review">
                <div className="wizard-review-row">
                  <span>Frequency</span>
                  <strong>{freqLabel}</strong>
                </div>
                <div className="wizard-review-row">
                  <span>Delivery</span>
                  <strong>Day {deliveryDay} of the month</strong>
                </div>
                {selectedIds.map((id) => {
                  const a = amountByTemplate[id] || {};
                  const splits = Math.max(1, parseInt(a.splits, 10) || 1);
                  return (
                    <div key={id} className="wizard-review-row">
                      <span>{getTemplate(id)?.name}</span>
                      <strong>
                        ₹{Number(a.total || 0).toLocaleString('en-IN')} · {splits} bill
                        {splits > 1 ? 's' : ''}
                      </strong>
                    </div>
                  );
                })}
                <div className="wizard-review-row wizard-review-total">
                  <span>Total each delivery</span>
                  <strong>
                    {totalBillCount} bill{totalBillCount > 1 ? 's' : ''}
                  </strong>
                </div>
              </div>

              {!isSubscribed && (
                <div className="wizard-upsell">
                  Setup saves now; delivery starts once you subscribe (₹149/month).
                  {subError && <div className="wizard-upsell-error">{subError}</div>}
                  <button
                    className="btn btn-primary wizard-upsell-btn"
                    onClick={handleSubscribe}
                    disabled={subscribing}
                  >
                    {subscribing ? (
                      <>
                        <span className="spinner" /> Processing...
                      </>
                    ) : (
                      'Subscribe now — ₹149/month'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="wizard-nav">
            {step > 0 ? (
              <button type="button" className="btn btn-ghost" onClick={goBack}>
                <ArrowLeft size={16} weight="bold" /> Back
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/home')}>
                Cancel
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary" disabled={!canNext} onClick={goNext}>
                {step === 1 && detailIndex < selectedIds.length - 1 ? 'Next bill' : 'Next'}{' '}
                <ArrowRight size={16} weight="bold" />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={handleActivate}
              >
                {saving ? 'Saving...' : 'Set it in motion'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default SetupWizard;
