import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import { runDebate } from './engine/debateOrchestrator.js';

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,           // set this on Railway once you know your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman) and any vercel.app subdomain
    if (!origin || ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
}));
app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ─── Debate (SSE) ──────────────────────────────────────────────────────────
app.post('/api/debate', async (req, res) => {
  const { decision, context } = req.body ?? {};

  if (!decision || !decision.trim()) {
    return res.status(400).json({ error: 'decision is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    for await (const event of runDebate(decision.trim(), context?.trim() ?? '')) {
      send(event);
      if (event.type === 'done') break;
    }
  } catch (err) {
    console.error('[/api/debate] Error:', err);
    send({ type: 'error', message: err.message ?? 'Internal server error' });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
