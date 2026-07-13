// Derive a display name from an email's local-part so we don't have to ask for
// it: strip digits, split on separators, title-case each word.
//   "ramnan10118@gmail.com" -> "Ramnan"
//   "john.doe@x.com"        -> "John Doe"
export function nameFromEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const local = email.split('@')[0] || '';
  const cleaned = local.replace(/[0-9]+/g, ' ').replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
