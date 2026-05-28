const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS: allow your Netlify site (and localhost for dev) ──
app.use((req, res, next) => {
  const allowed = [
    'https://www.nyayai.online',
    'http://www.nyayai.online',
    'https://nyayai.online',
    'http://nyayai.online',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  const origin = req.headers.origin;
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Parse JSON bodies up to 20 MB ──
app.use(express.json({ limit: '20mb' }));

// ── Anthropic proxy ──
app.post('/api/claude', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY env var not set on server.' } });
  }
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error('[/api/claude] error:', err);
    res.status(502).json({ error: { message: 'Upstream Anthropic request failed.' } });
  }
});

// ── Health check ──
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Nyay AI proxy running on port ${PORT}`);
});
