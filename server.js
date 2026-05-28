const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Parse JSON bodies up to 20 MB (for base64 PDF/image payloads) ──
app.use(express.json({ limit: '20mb' }));

// ── Serve the single HTML file ──
app.use(express.static(path.join(__dirname, 'public')));

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
        'Content-Type':       'application/json',
        'x-api-key':          apiKey,
        'anthropic-version':  '2023-06-01',
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

// ── Fallback: serve index.html for any unmatched route ──
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Nyay AI server running on port ${PORT}`);
});
