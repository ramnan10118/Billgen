// Recurring monthly bill generation — shared by the delivery cron and the
// frontend setup wizard. Framework-free (no React) so it imports cleanly into
// Vercel serverless functions.
//
// Each month a schedule turns ONE saved set of static fields into N bills, each
// with a fresh date, freshly regenerated IDs, and an amount that splits the
// user's monthly rupee target. See docs / CHANGELOG (monthly-bill-testing).

import { TEMPLATES } from '../templates/templateConfig.js';
import {
  formatDate,
  months,
  generateBillNumber,
  generateAccountNumber,
  generatePlayoId,
  generateShellTxnId,
  generateBroadbandReceiptNo,
  generateBroadbandOrderNo,
  generatePhonePeTxnId,
  generateUtrNumber,
} from './dateHelpers.js';

// Single source of truth for the autoGenerate -> fn mapping. Generator.jsx
// imports this instead of redeclaring it.
export const AUTO_GENERATORS = {
  billNumber: generateBillNumber,
  accountNumber: generateAccountNumber,
  playoId: generatePlayoId,
  shellTxnId: generateShellTxnId,
  broadbandReceiptNo: generateBroadbandReceiptNo,
  broadbandOrderNo: generateBroadbandOrderNo,
  phonePeTxnId: generatePhonePeTxnId,
  utrNumber: generateUtrNumber,
};

// --- Randomisers for auto-varied fields -----------------------------------
// These fields belong on the bill but the user never fills them; the engine
// generates a fresh, plausible value per bill so no two bills look identical.
const pad2 = (n) => String(n).padStart(2, '0');
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const FUEL_CODES = ['01', '02', '03', '04'];
const PLAYO_COURTS = [
  '5 a side Turf-1', '5 a side Turf-2', '7 a side Turf-1', '7 a side Turf-2',
  'Court 1', 'Court 2', 'Court 3',
];
const PLAYO_SLOTS = [
  '6:00 AM - 7:00 AM', '7:00 AM - 8:00 AM', '8:00 AM - 9:00 AM',
  '6:00 PM - 7:00 PM', '7:00 PM - 8:00 PM', '8:00 PM - 9:00 PM', '9:00 PM - 10:00 PM',
];

const genTime24 = () => `${pad2(randInt(6, 21))}:${pad2(randInt(0, 59))}`;
const genClockAmPm = () => {
  const h = randInt(6, 21);
  return `${pad2(h)}:${pad2(randInt(0, 59))} ${h < 12 ? 'AM' : 'PM'}`;
};

// Per-template recurring strategy: which fields carry the bill date, and how to
// hit a target rupee amount. `direct` sets a single currency field; `derived`
// (petrol) keeps the rate fixed and back-solves quantity from the amount.
// `variableFields` are auto-generated per bill (ordered — later gens may read
// values set by earlier ones and by the amount step).
export const RECURRING_CONFIG = {
  driver: {
    dateFields: [
      { id: 'receiptDate', kind: 'date' },
      { id: 'month', kind: 'period' },
    ],
    amount: { type: 'direct', field: 'salaryAmount' },
  },
  broadband: {
    dateFields: [{ id: 'paymentDate', kind: 'date' }],
    amount: { type: 'direct', field: 'paidAmount' },
    // Hidden from setup but NOT regenerated — they keep their default on every
    // bill (fixed line number stays the same throughout, as it should).
    constantFields: ['paymentType', 'fixedLineNumber'],
  },
  upi: {
    dateFields: [{ id: 'paymentDateTime', kind: 'datetime' }],
    amount: { type: 'direct', field: 'salaryAmount' },
  },
  playo: {
    dateFields: [
      { id: 'slotDate', kind: 'date' },
      { id: 'bookingDate', kind: 'date' },
    ],
    amount: { type: 'direct', field: 'courtPrice' },
    variableFields: [
      { id: 'court', gen: () => pick(PLAYO_COURTS) },
      { id: 'slotTime', gen: () => pick(PLAYO_SLOTS) },
      { id: 'convenienceFee', gen: (f) => ((parseFloat(f.courtPrice) || 0) * (0.02 + Math.random() * 0.015)).toFixed(2) },
      { id: 'discount', gen: () => pick(['0', '0', '0', '0', '50', '100']) },
      // Advance paid = the total actually paid (court + fee - discount).
      { id: 'advancePaid', gen: (f) =>
        ((parseFloat(f.courtPrice) || 0) + (parseFloat(f.convenienceFee) || 0) - (parseFloat(f.discount) || 0)).toFixed(2) },
      { id: 'bookingTime', gen: () => genClockAmPm() },
    ],
  },
  petrol: {
    dateFields: [{ id: 'transactionDate', kind: 'date' }],
    amount: { type: 'derived', qtyField: 'quantity', rateField: 'ratePerLitre' },
    variableFields: [
      { id: 'transactionTime', gen: () => genTime24() },
      { id: 'fuelCode', gen: () => pick(FUEL_CODES) },
      // Points scale loosely with litres bought so they track the amount.
      { id: 'pointsEarned', gen: (f) => String(Math.max(1, Math.round((parseFloat(f.quantity) || 20) * (3 + Math.random() * 3)))) },
      { id: 'bonusPoints', gen: () => String(randInt(400, 1200)) },
    ],
  },
};

/**
 * Field ids the engine regenerates each month (dates and all auto-generated
 * IDs). The wizard hides these — the user can't usefully set them because
 * they're overwritten per bill. The amount is intentionally NOT hidden: the
 * user sets it as a normal field and the engine leaves it untouched (amounts
 * are decided manually for now — see generateMonthlyBills).
 */
export function getEngineOwnedFieldIds(templateId) {
  const template = TEMPLATES[templateId];
  const cfg = RECURRING_CONFIG[templateId];
  if (!template || !cfg) return [];

  const ids = new Set();
  for (const df of cfg.dateFields) ids.add(df.id);
  for (const vf of cfg.variableFields || []) ids.add(vf.id);
  for (const field of template.fields) {
    if (field.autoGenerate && AUTO_GENERATORS[field.autoGenerate]) ids.add(field.id);
  }
  return [...ids];
}

/**
 * A single bill's rupee amount, for display/naming. `direct` reads its currency
 * field; `derived` (petrol) recomputes quantity × rate.
 */
export function getBillAmount(templateId, fields) {
  const cfg = RECURRING_CONFIG[templateId];
  if (!cfg || !cfg.amount) return null;
  if (cfg.amount.type === 'direct') {
    return Math.round(parseFloat(fields[cfg.amount.field]) || 0);
  }
  if (cfg.amount.type === 'derived') {
    const qty = parseFloat(fields[cfg.amount.qtyField]) || 0;
    const rate = parseFloat(fields[cfg.amount.rateField]) || 0;
    return Math.round(qty * rate);
  }
  return null;
}

/**
 * Fields hidden from setup but kept constant across bills (not regenerated) —
 * e.g. broadband's fixed line number and payment type. They carry their seeded
 * default value onto every generated bill.
 */
export function getConstantFieldIds(templateId) {
  const cfg = RECURRING_CONFIG[templateId];
  return cfg && cfg.constantFields ? [...cfg.constantFields] : [];
}

/**
 * Field ids the amount engine owns — driven by the user's total, so the setup
 * wizard hides them from the per-bill details step. `direct` owns its currency
 * field; `derived` (petrol) owns the quantity it back-solves from the amount.
 */
export function getAmountOwnedFieldIds(templateId) {
  const cfg = RECURRING_CONFIG[templateId];
  if (!cfg || !cfg.amount) return [];
  if (cfg.amount.type === 'direct') return [cfg.amount.field];
  if (cfg.amount.type === 'derived') return [cfg.amount.qtyField];
  return [];
}

/**
 * Split `total` rupees into `n` positive integers that sum EXACTLY to total,
 * with random jitter so the parts look organic (not all equal).
 */
export function splitAmount(total, n) {
  total = Math.round(Number(total) || 0);
  n = Math.max(1, Math.floor(n));
  if (n === 1) return [total];
  if (total <= n) {
    // Not enough to give everyone >= 1 with jitter; distribute as evenly as we can.
    return Array.from({ length: n }, (_, i) => (i < total ? 1 : 0));
  }

  const weights = Array.from({ length: n }, () => 0.5 + Math.random());
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w) => Math.max(1, Math.round((w / weightSum) * total)));

  // Correct rounding drift so the parts sum to exactly `total`.
  let diff = total - parts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0) {
    const idx = i % n;
    if (diff > 0) {
      parts[idx] += 1;
      diff -= 1;
    } else if (parts[idx] > 1) {
      parts[idx] -= 1;
      diff += 1;
    }
    i += 1;
  }
  return parts;
}

/** All weekday (Mon–Fri) Dates within [start, end] inclusive. */
function weekdaysInRange(start, end) {
  const out = [];
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (d <= last) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Pick `k` distinct random items from an array (or all + random repeats if k
// exceeds the array length).
function pickRandom(arr, k) {
  const out = [];
  if (arr.length === 0) return out;
  if (k <= arr.length) {
    const used = new Set();
    while (out.length < k) {
      const i = Math.floor(Math.random() * arr.length);
      if (used.has(i)) continue;
      used.add(i);
      out.push(arr[i]);
    }
  } else {
    out.push(...arr);
    while (out.length < k) out.push(arr[Math.floor(Math.random() * arr.length)]);
  }
  return out;
}

/**
 * `n` distinct weekday Dates within [start, end], ascending. Weekends are
 * skipped. Dates are STRATIFIED by calendar month: the count is allocated to
 * each month proportional to how many weekdays it contributes to the window
 * (largest-remainder rounding), then random dates are drawn within each month.
 * So the month with more days in the window reliably gets more bills — even for
 * a small batch — instead of only on average.
 */
export function spreadWeekdayDates(n, start, end) {
  const count = Math.max(1, Math.floor(n));
  const pool = weekdaysInRange(start, end);
  if (pool.length === 0) return pickRandom([new Date(start)], count).sort((a, b) => a - b);

  // Group weekdays by calendar month, ascending.
  const groups = new Map();
  for (const d of pool) {
    const key = d.getFullYear() * 12 + d.getMonth();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }
  const keys = [...groups.keys()].sort((a, b) => a - b);

  // Proportional allocation with largest-remainder for the leftover.
  const alloc = keys.map((k) => {
    const exact = (groups.get(k).length / pool.length) * count;
    return { k, n: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let assigned = alloc.reduce((s, a) => s + a.n, 0);
  const byFrac = [...alloc].sort((a, b) => b.frac - a.frac);
  for (let i = 0; assigned < count; i++, assigned++) byFrac[i % byFrac.length].n += 1;

  const chosen = [];
  for (const a of alloc) chosen.push(...pickRandom(groups.get(a.k), a.n));
  return chosen.sort((a, b) => a - b);
}

/**
 * The billing-cycle window bills should be dated within: from the delivery day
 * one cycle ago to the delivery day now (e.g. delivery on the 12th → Jun 12 to
 * Jul 12). Because dates are then sampled uniformly across the weekdays in this
 * window, they land *proportional* to how many days each month contributes —
 * so the earlier month (more days in the window) naturally gets more bills.
 *
 * @param {'once'|'monthly'|'bimonthly'} frequency
 * @param {number} deliveryDay  day-of-month the bills are delivered (1–31)
 * @param {Date}   now          the run/delivery date
 */
export function billDateRange(frequency, deliveryDay, now = new Date()) {
  const monthsBack = frequency === 'bimonthly' ? 2 : 1;
  const day = Math.min(31, Math.max(1, parseInt(deliveryDay, 10) || 1));
  const clampToMonth = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
  };
  const end = clampToMonth(now.getFullYear(), now.getMonth());
  const start = clampToMonth(now.getFullYear(), now.getMonth() - monthsBack);
  return { start, end };
}

/**
 * `n` distinct day-of-month Dates within the month of `monthDate`, ascending.
 * Kept for callers that want a plain month spread; now weekday-aware.
 */
export function spreadDates(monthDate, n) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return spreadWeekdayDates(n, start, end);
}

function formatDateField(date, kind) {
  switch (kind) {
    case 'period':
      // Matches getDatePresets().currentMonth.label — just the month name.
      return months[date.getMonth()];
    case 'datetime': {
      const hour = 8 + Math.floor(Math.random() * 9); // 8am–4pm-ish
      const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0');
      const ampm = hour < 12 ? 'am' : 'pm';
      const h12 = hour > 12 ? hour - 12 : hour;
      return `${h12}:${minute} ${ampm} on ${formatDate(date, 'DD MMM YYYY')}`;
    }
    case 'date':
    default:
      return formatDate(date); // DD/MM/YYYY
  }
}

function applyAmount(amountCfg, fields, amount) {
  if (!amountCfg || amount == null) return;
  if (amountCfg.type === 'direct') {
    fields[amountCfg.field] = String(amount);
  } else if (amountCfg.type === 'derived') {
    const rate = parseFloat(fields[amountCfg.rateField]) || 0;
    if (rate > 0) {
      fields[amountCfg.qtyField] = (amount / rate).toFixed(2);
    }
  }
}

/**
 * Turn a saved schedule into this month's bills.
 *
 * @param {string} templateId
 * @param {object} baseFields  static fields saved from the wizard
 * @param {object} opts
 * @param {number} [opts.splitCount]   number of copies to produce (default 1)
 * @param {number} [opts.monthlyTarget] optional — when > 0, splits this rupee
 *                                       total across the copies; otherwise the
 *                                       amount fields are left as the user set them
 * @param {Date}   [opts.now]          the month to generate for (defaults today)
 * @param {Date}   [opts.rangeStart]   start of the bill-date window (optional)
 * @param {Date}   [opts.rangeEnd]     end of the bill-date window (optional)
 * @returns {object[]} array of field objects, ready to base64-encode
 */
export function generateMonthlyBills(
  templateId,
  baseFields,
  { monthlyTarget = 0, splitCount = 1, now = new Date(), rangeStart, rangeEnd } = {}
) {
  const template = TEMPLATES[templateId];
  if (!template) return [];

  const cfg = RECURRING_CONFIG[templateId] || { dateFields: [], amount: null };
  const n = Math.max(1, Math.floor(splitCount));
  // Only split an amount when a positive target is given; otherwise leave the
  // amount fields exactly as the user configured them.
  const useTarget = Number(monthlyTarget) > 0 && cfg.amount;
  const amounts = useTarget ? splitAmount(monthlyTarget, n) : new Array(n).fill(null);
  // Dates fall on weekdays within the given range, defaulting to `now`'s month.
  const start = rangeStart || new Date(now.getFullYear(), now.getMonth(), 1);
  const end = rangeEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dates = spreadWeekdayDates(n, start, end);

  return Array.from({ length: n }, (_, i) => {
    const fields = { ...baseFields };

    // Fresh IDs every bill.
    for (const field of template.fields) {
      const gen = field.autoGenerate && AUTO_GENERATORS[field.autoGenerate];
      if (gen) fields[field.id] = gen();
    }

    // Fresh date(s) for this bill.
    for (const df of cfg.dateFields) {
      fields[df.id] = formatDateField(dates[i], df.kind);
    }

    // This bill's share of the monthly target.
    applyAmount(cfg.amount, fields, amounts[i]);

    // Auto-varied fields (times, court, fees…) — after amount so gens that
    // depend on the amount (points, advance paid) read the final values.
    for (const vf of cfg.variableFields || []) {
      fields[vf.id] = vf.gen(fields);
    }

    return fields;
  });
}
