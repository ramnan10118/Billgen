export function isPdfLogoDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:application/pdf');
}
