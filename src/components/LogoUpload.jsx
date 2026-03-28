import { useCallback, useRef, useState } from 'react';
import './LogoUpload.css';

const MAX_BYTES = 2 * 1024 * 1024;

const MIME_ALLOW = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

function isAllowedImage(file) {
  const t = (file.type || '').toLowerCase().trim();
  if (MIME_ALLOW.has(t)) return true;
  const n = file.name.toLowerCase();
  return /\.(png|jpe?g|svg)$/.test(n);
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
      if (!isAllowedImage(file)) {
        setError('Please upload PNG, JPG or SVG');
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
      {dimensionHint ? <p className="logo-upload-dimensions">{dimensionHint}</p> : null}

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
            accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
            onChange={handleInputChange}
            aria-label="Upload business logo"
          />
          <span className="logo-upload-icon" aria-hidden>
            ↑
          </span>
          <span className="logo-upload-cta">Click to browse or drag and drop</span>
          <span className="logo-upload-formats">PNG, JPG or SVG · max 2MB</span>
        </div>
      ) : (
        <div className="logo-upload-preview-wrap">
          <img src={value} alt="" className="logo-upload-preview-img" />
          <button
            type="button"
            className="logo-upload-remove"
            onClick={handleRemove}
            aria-label="Remove logo"
          >
            ✕
          </button>
        </div>
      )}

      {error ? <p className="logo-upload-error">{error}</p> : null}
    </div>
  );
}
