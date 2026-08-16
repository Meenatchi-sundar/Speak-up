// Lightweight JS handler to ensure Vercel deploys a function for /api/interview
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    // Proxy to Anthropic if API key present; otherwise return helpful error so logs appear
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[interview.js] Missing ANTHROPIC_API_KEY');
      return res.status(500).json({ error: 'Missing Anthropic API Key on server' });
    }

    const payload = {
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: body.messages && body.messages.length ? body.messages : [{ role: 'user', content: body.prompt || 'Hello' }],
    };

    const fetchRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await fetchRes.json();
    if (!fetchRes.ok) {
      console.error('[interview.js] Anthropic error', data);
      return res.status(fetchRes.status).json({ error: data.error?.message || 'Anthropic error', detail: data });
    }

    const text = data.content?.[0]?.text || '';
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[interview.js] Unexpected error', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
