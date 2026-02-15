import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

// Export element as PDF
export const exportToPDF = async (element, filename = 'bill.pdf', fitToContent = false) => {
  if (!element) {
    throw new Error('No element provided for PDF export');
  }

  // Get element dimensions for fit-to-content mode
  const elementWidth = element.scrollWidth;
  const elementHeight = element.scrollHeight;
  
  // Convert pixels to mm (96 DPI)
  const pxToMm = (px) => px * 0.264583;

  const options = {
    margin: 0,
    filename: filename,
    image: { type: 'png', quality: 1 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: fitToContent ? '#000000' : '#ffffff',
      width: fitToContent ? elementWidth : undefined,
      height: fitToContent ? elementHeight : undefined,
    },
    jsPDF: fitToContent ? { 
      unit: 'mm', 
      format: [pxToMm(elementWidth), pxToMm(elementHeight)], 
      orientation: 'portrait' 
    } : { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
  };

  try {
    await html2pdf().set(options).from(element).save();
    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};

// Export element as image (PNG or JPG)
export const exportToImage = async (element, filename = 'bill.png', format = 'png', transparentBg = false) => {
  if (!element) {
    throw new Error('No element provided for image export');
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: transparentBg ? null : '#ffffff',
    });

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.95 : undefined;
    
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
export const exportBill = async (element, format = 'pdf', templateName = 'bill', fitToContent = false) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const baseFilename = `${templateName}-${timestamp}`;

  switch (format) {
    case 'pdf':
      return exportToPDF(element, `${baseFilename}.pdf`, fitToContent);
    case 'png':
      return exportToImage(element, `${baseFilename}.png`, 'png');
    case 'jpg':
      return exportToImage(element, `${baseFilename}.jpg`, 'jpg');
    default:
      return exportToPDF(element, `${baseFilename}.pdf`, fitToContent);
  }
};
