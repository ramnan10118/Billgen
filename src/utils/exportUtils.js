import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const PX_TO_MM = 0.264583; // 96 DPI

// Render an element to a single-page jsPDF sized exactly to the element. Doing
// this directly (instead of via html2pdf) means a bill never spills a nearly-
// empty second page from html2pdf's floating-point pagination.
async function renderElementToPdf(element) {
  if (!element) throw new Error('No element provided for PDF export');

  const computedBg = window.getComputedStyle(element).backgroundColor;
  const isDarkBg = computedBg && (computedBg.includes('0, 0, 0') || computedBg === 'rgb(0, 0, 0)');
  const bgColor = isDarkBg ? '#000000' : '#ffffff';
  const width = element.scrollWidth;
  const height = element.scrollHeight;

  const canvas = await html2canvas(element, {
    scale: 1.5,
    useCORS: true,
    logging: false,
    backgroundColor: bgColor,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
  });

  const pageW = width * PX_TO_MM;
  const pageH = height * PX_TO_MM;
  const pdf = new jsPDF({
    unit: 'mm',
    format: [pageW, pageH],
    orientation: pageW >= pageH ? 'landscape' : 'portrait',
    compress: true,
  });
  // Use the page's own reported size so the image fills exactly one page.
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.75), 'JPEG', 0, 0, w, h);
  return pdf;
}

// Export element as a single-page PDF (triggers a download).
export const exportToPDF = async (element, filename = 'bill.pdf') => {
  try {
    const pdf = await renderElementToPdf(element);
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};

// Render an element to a single-page PDF Blob (for zipping) — identical output
// to exportToPDF, just not saved to disk.
export const exportToPDFBlob = async (element) => {
  const pdf = await renderElementToPdf(element);
  return pdf.output('blob');
};

// Export element as image (PNG or JPG)
export const exportToImage = async (element, filename = 'bill.png', format = 'png', transparentBg = false) => {
  if (!element) {
    throw new Error('No element provided for image export');
  }

  const computedBg = window.getComputedStyle(element).backgroundColor;
  const isDarkBg = computedBg && (computedBg.includes('0, 0, 0') || computedBg === 'rgb(0, 0, 0)');
  const bgColor = transparentBg ? null : (isDarkBg ? '#000000' : '#ffffff');

  try {
    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: bgColor,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.85 : undefined;

    const dataUrl = canvas.toDataURL(mimeType, quality);

    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    return true;
  } catch (error) {
    console.error('Image export failed:', error);
    throw error;
  }
};

// Generic export function
export const exportBill = async (element, format = 'pdf', templateName = 'bill') => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const baseFilename = `${templateName}-${timestamp}`;

  switch (format) {
    case 'pdf':
      return exportToPDF(element, `${baseFilename}.pdf`);
    case 'png':
      return exportToImage(element, `${baseFilename}.png`, 'png');
    case 'jpg':
      return exportToImage(element, `${baseFilename}.jpg`, 'jpg');
    default:
      return exportToPDF(element, `${baseFilename}.pdf`);
  }
};
