import { useCallback, useRef, useState } from 'react';
import { X, UploadSimple, Ruler, FilePng, FilePdf } from '@phosphor-icons/react';
import { isPdfLogoDataUrl } from '../utils/logoHelpers';
import './LogoUpload.css';

const MAX_BYTES = 2 * 1024 * 1024;

const MIME_ALLOW = new Set(['image/png', 'application/pdf']);

function isAllowedLogoFile(file) {
  const t = (file.type || '').toLowerCase().trim();
  if (MIME_ALLOW.has(t)) return true;
  const n = file.name.toLowerCase();
  return /\.(png|pdf)$/.test(n);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function LogoUpload({ value, onChange, dimensionHint }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const clearError = () => setError('');

  const processFile = useCallback(
    async (file) => {
      clearError();
      if (!file) return;

      if (file.size > MAX_BYTES) {
        setError('File too large. Max 2MB.');
        return;
      }
      if (!isAllowedLogoFile(file)) {
        setError('Please upload PNG or PDF');
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        onChange(typeof dataUrl === 'string' ? dataUrl : null);
      } catch {
        setError('Could not read file. Try another image.');
      }
    },
    [onChange]
  );

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const openPicker = () => {
    clearError();
    inputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    clearError();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="logo-upload">
      <span className="logo-upload-label">Business Logo (optional)</span>
      <p className="logo-upload-hint">Add your own logo to this document</p>
      {dimensionHint ? (
        <p className="logo-upload-dimensions">
          <Ruler size={18} weight="duotone" className="logo-upload-dimensions-icon" aria-hidden />
          <span>
            <strong>Dimensions</strong> · {dimensionHint}
          </span>
        </p>
      ) : null}

      {!value ? (
        <div
          role="button"
          tabIndex={0}
          className={`logo-upload-zone ${dragOver ? 'logo-upload-zone--drag' : ''}`}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".png,.pdf,image/png,application/pdf"
            onChange={handleInputChange}
            aria-label="Upload business logo"
          />
          <span className="logo-upload-icon" aria-hidden>
            <UploadSimple size={28} weight="duotone" />
          </span>
          <span className="logo-upload-cta">Click to browse or drag and drop</span>
          <span className="logo-upload-formats">
            <FilePng size={18} weight="duotone" className="logo-upload-format-icon" aria-hidden />
            PNG
            <span className="logo-upload-formats-sep" aria-hidden>
              ·
            </span>
            <FilePdf size={18} weight="duotone" className="logo-upload-format-icon" aria-hidden />
            PDF
            <span className="logo-upload-formats-sep" aria-hidden>
              ·
            </span>
            max 2MB
          </span>
        </div>
      ) : (
        <div className="logo-upload-preview-wrap">
          {isPdfLogoDataUrl(value) ? (
            <object
              data={value}
              type="application/pdf"
              className="logo-upload-preview-pdf"
              aria-label="Logo PDF preview"
            />
          ) : (
            <img src={value} alt="" className="logo-upload-preview-img" />
          )}
          <button
            type="button"
            className="logo-upload-remove"
            onClick={handleRemove}
            aria-label="Remove logo"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      )}

      {error ? <p className="logo-upload-error">{error}</p> : null}
    </div>
  );
}
