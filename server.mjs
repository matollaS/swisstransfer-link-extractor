import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveSwissTransfer, SwissTransferResolveError } from './swisstransfer-resolver.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for fly.io / monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// REST API endpoint - GET support
app.get('/api/resolve', async (req, res) => {
  const url = req.query.url;
  const password = req.query.password || null;

  if (!url) {
    return res.status(400).json({ error: 'Missing required query parameter: url' });
  }

  try {
    const result = await resolveSwissTransfer(url, password);
    res.json({ success: true, data: result });
  } catch (err) {
    const statusCode = err instanceof SwissTransferResolveError ? 400 : 500;
    res.status(statusCode).json({ success: false, error: err.message });
  }
});

// REST API endpoint - POST support
app.post('/api/resolve', async (req, res) => {
  const { url, password } = req.body || {};

  if (!url) {
    return res.status(400).json({ success: false, error: 'Missing required field: url' });
  }

  try {
    const result = await resolveSwissTransfer(url, password || null);
    res.json({ success: true, data: result });
  } catch (err) {
    const statusCode = err instanceof SwissTransferResolveError ? 400 : 500;
    res.status(statusCode).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SwissTransfer Link Extractor listening on port ${PORT}`);
});
