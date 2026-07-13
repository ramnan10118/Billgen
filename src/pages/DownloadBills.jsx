import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Lightning, Warning, DownloadSimple } from '@phosphor-icons/react';
import { getTemplate } from '../templates/templateConfig';
import { exportToPDFBlob } from '../utils/exportUtils';
import { getBillAmount } from '../utils/recurringBill';
import { zipBills, downloadBlob } from '../utils/zipBills';
import BillPreview from '../components/BillPreview';
import './DownloadBills.css';

// Each template wraps its actual bill in a class; export that element (not the
// preview chrome), matching the Generator's export behaviour.
const TEMPLATE_CLASS = {
  driver: '.template-driver',
  upi: '.template-upi',
  playo: '.template-playo',
  petrol: '.template-shell',
  broadband: '.template-broadband',
};

function decodeBills(encoded) {
  if (!encoded) return null;
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const parsed = JSON.parse(atob(b64));
    if (!Array.isArray(parsed)) return null;
    // Keep only bills whose template still exists.
    return parsed
      .map((b) => ({ templateId: b.templateId, fields: b.fields || b.fieldData || {} }))
      .filter((b) => getTemplate(b.templateId));
  } catch {
    return null;
  }
}

const DownloadBills = () => {
  const [searchParams] = useSearchParams();
  const monthName = searchParams.get('month') || '';
  const bills = useRef(decodeBills(searchParams.get('data'))).current;

  const [status, setStatus] = useState('preparing'); // preparing | done | error
  const [doneFlags, setDoneFlags] = useState(() => (bills ? bills.map(() => false) : []));
  const billRefs = useRef([]);
  const zipBlobRef = useRef(null);
  const started = useRef(false);

  const folderName = `RavenLog Bills${monthName ? ` - ${monthName}` : ''}`;
  const zipFileName = `${folderName.replace(/\s+/g, '-')}.zip`;

  // One-shot: generate the ZIP exactly once on mount and auto-download. No
  // cleanup-based cancellation — StrictMode's mount→cleanup→mount would abort
  // the only running loop and leave the page stuck on "Preparing…".
  useEffect(() => {
    if (started.current) return;
    if (!bills || bills.length === 0) {
      setStatus('error');
      return;
    }
    started.current = true;

    (async () => {
      try {
        // Wait for webfonts so the captured bills aren't rendered in a fallback face.
        if (document.fonts?.ready) await document.fonts.ready;
        // One more frame so layout/paint settles before capture.
        await new Promise((r) => requestAnimationFrame(() => r()));

        const files = [];
        const counts = {}; // per-template running number
        for (let i = 0; i < bills.length; i++) {
          const { templateId, fields } = bills[i];
          const wrapper = billRefs.current[i];
          const cls = TEMPLATE_CLASS[templateId];
          const el = (cls && wrapper?.querySelector(cls)) || wrapper;
          const blob = await exportToPDFBlob(el);

          // File name: "₹3770 Petrol Bill 1" — amount, bill name, index.
          counts[templateId] = (counts[templateId] || 0) + 1;
          const tplName = getTemplate(templateId)?.name || 'Bill';
          const amount = getBillAmount(templateId, fields);
          const name =
            amount != null
              ? `₹${amount} ${tplName} ${counts[templateId]}`
              : `${tplName} ${counts[templateId]}`;
          files.push({ name, blob });
          setDoneFlags((prev) => prev.map((v, idx) => (idx === i ? true : v)));
        }

        const zip = await zipBills(folderName, files);
        zipBlobRef.current = zip;
        downloadBlob(zip, zipFileName);
        setStatus('done');
      } catch (err) {
        console.error('Bill ZIP generation failed:', err);
        setStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redownload = () => {
    if (zipBlobRef.current) downloadBlob(zipBlobRef.current, zipFileName);
  };

  return (
    <div className="dl-page">
      <div className="dl-bg">
        <div className="dl-grid" />
        <div className="dl-vignette" />
      </div>

      <div className="dl-card">
        <div className="dl-brand">RΛVEN_LOG</div>

        {status === 'error' ? (
          <>
            <div className="dl-icon dl-icon-error">
              <Warning size={34} weight="duotone" />
            </div>
            <h1 className="dl-title">Link expired or invalid</h1>
            <p className="dl-sub">
              We couldn&apos;t read the bills in this link. Open RavenLog and download them from your
              dashboard instead.
            </p>
            <a className="dl-btn" href="/home">Go to RavenLog</a>
          </>
        ) : status === 'done' ? (
          <>
            <div className="dl-icon dl-icon-done">
              <Check size={34} weight="bold" />
            </div>
            <h1 className="dl-title">Your bills are downloaded</h1>
            <p className="dl-sub">
              {bills.length} bill{bills.length > 1 ? 's' : ''}
              {monthName ? ` for ${monthName}` : ''} saved as <strong>{zipFileName}</strong>. Unzip
              to find each bill inside.
            </p>
            <button type="button" className="dl-btn" onClick={redownload}>
              <DownloadSimple size={18} weight="bold" /> Download again
            </button>
          </>
        ) : (
          <>
            <div className="dl-icon dl-icon-prep">
              <Lightning size={34} weight="duotone" />
            </div>
            <h1 className="dl-title">Preparing your bills…</h1>
            <p className="dl-sub">Packaging {bills?.length || 0} bills into a single download.</p>
            <ul className="dl-list">
              {bills?.map((b, i) => (
                <li key={i} className={`dl-list-item ${doneFlags[i] ? 'done' : ''}`}>
                  <span className="dl-list-check">
                    {doneFlags[i] ? <Check size={13} weight="bold" /> : <span className="dl-spinner" />}
                  </span>
                  {getTemplate(b.templateId)?.name || b.templateId}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Off-screen render targets — html2canvas needs real layout, so we keep
          them positioned off-canvas rather than display:none. */}
      <div className="dl-offscreen" aria-hidden>
        {bills?.map((b, i) => (
          <div key={i} ref={(el) => (billRefs.current[i] = el)}>
            <BillPreview templateId={b.templateId} data={b.fields} tier={3} logoUrl={null} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DownloadBills;
