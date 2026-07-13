import JSZip from 'jszip';

// Make a filename safe across OSes: strip path separators and reserved chars.
function safeName(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, '').trim() || 'Bill';
}

/**
 * Bundle bill PDFs into a single ZIP whose files sit inside one folder, so
 * unzipping yields "RavenLog-Bills-<Month>/<Bill>.pdf".
 *
 * @param {string} folderName  Top-level folder inside the archive.
 * @param {Array<{ name: string, blob: Blob }>} files  name = display bill name.
 * @returns {Promise<Blob>} the ZIP as a Blob.
 */
export async function zipBills(folderName, files) {
  const zip = new JSZip();
  const folder = zip.folder(safeName(folderName));

  // De-dupe identical bill names (e.g. two of the same template) so nothing
  // silently overwrites in the archive.
  const seen = new Map();
  for (const { name, blob } of files) {
    const base = safeName(name);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    const fileName = count === 0 ? `${base}.pdf` : `${base} (${count + 1}).pdf`;
    folder.file(fileName, blob);
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has committed.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
