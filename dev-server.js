import 'dotenv/config';
import express from 'express';
import { readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

const apiDir = resolve(__dirname, 'api');
const files = readdirSync(apiDir).filter(f => f.endsWith('.js') && !f.startsWith('_'));

for (const file of files) {
  const routeName = file.replace('.js', '');
  const modulePath = `./api/${file}`;
  const mod = await import(modulePath);
  const handler = mod.default;

  if (typeof handler === 'function') {
    app.all(`/api/${routeName}`, async (req, res) => {
      try {
        await handler(req, res);
      } catch (err) {
        console.error(`Error in /api/${routeName}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: err.message });
        }
      }
    });
    console.log(`  /api/${routeName}`);
  }
}

app.listen(PORT, () => {
  console.log(`\n  API dev server running at http://localhost:${PORT}`);
  console.log(`  Routes loaded:`);
});
