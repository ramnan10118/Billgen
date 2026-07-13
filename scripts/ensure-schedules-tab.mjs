import 'dotenv/config';
import { getSheets, SPREADSHEET_ID } from '../api/_sheets.js';

const TAB = 'Schedules';
// A:G — the delivery cron reads a `frequency` column (once|monthly|bimonthly).
const HEADER = ['email', 'templates', 'config', 'deliveryDay', 'enabled', 'updatedAt', 'frequency'];

const sheets = getSheets();

const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
const titles = meta.data.sheets.map((s) => s.properties.title);
console.log('Existing tabs:', titles.join(', '));

if (titles.includes(TAB)) {
  const vals = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB}!A1:G1`,
  });
  const header = vals.data.values?.[0] || [];
  console.log(`✓ "${TAB}" tab already exists. Header row:`, JSON.stringify(header));

  // Backfill the frequency header if an older tab is missing it.
  if ((header[6] || '').toLowerCase() !== 'frequency') {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB}!G1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['frequency']] },
    });
    console.log('✓ Added missing "frequency" header (G1).');
  }
  process.exit(0);
}

console.log(`"${TAB}" tab missing — creating it...`);
await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
});

await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `${TAB}!A1:G1`,
  valueInputOption: 'RAW',
  requestBody: { values: [HEADER] },
});

console.log(`✓ Created "${TAB}" tab with header: ${HEADER.join(' | ')}`);
