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

function collectRoutes(dir, prefix = '') {
  const entries = readdirSync(dir, { withFileTypes: true });
  const routes = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      routes.push(...collectRoutes(resolve(dir, entry.name), `${prefix}/${entry.name}`));
    } else if (entry.name.endsWith('.js') && !entry.name.startsWith('_')) {
      const routeName = entry.name.replace('.js', '');
      routes.push({
        routePath: `/api${prefix}/${routeName}`,
        filePath: `./api${prefix}/${entry.name}`,
      });
    }
  }
  return routes;
}

const routes = collectRoutes(apiDir);

for (const { routePath, filePath } of routes) {
  const mod = await import(filePath);
  const handler = mod.default;

  if (typeof handler === 'function') {
    app.all(routePath, async (req, res) => {
      try {
        await handler(req, res);
      } catch (err) {
        console.error(`Error in ${routePath}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: err.message });
        }
      }
    });
    console.log(`  ${routePath}`);
  }
}

app.listen(PORT, () => {
  console.log(`\n  API dev server running at http://localhost:${PORT}`);
  console.log(`  Routes loaded:`);
});
