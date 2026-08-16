import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS + simple method guard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { system, messages, prompt } = req.body || {};

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[interview] Missing ANTHROPIC_API_KEY');
      return res.status(500).json({ error: 'Missing Anthropic API Key on server' });
    }

    const anthropicMessages = messages && messages.length > 0
      ? messages
      : [{ role: 'user', content: prompt || 'Hello' }];

    const payload = {
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      ...(system ? { system } : {}),
      messages: anthropicMessages,
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[interview] Anthropic API error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API Error', detail: data });
    }

    const text = data.content?.[0]?.text ?? '';
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('[interview] Unexpected server error:', error);
    return res.status(500).json({ error: error.message ?? 'Unknown server error' });
  }
}
