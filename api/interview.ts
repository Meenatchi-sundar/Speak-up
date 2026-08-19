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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[interview] Missing GEMINI_API_KEY');
      return res.status(500).json({ error: 'Missing Gemini API Key on server' });
    }

    const conversationMessages = messages && messages.length > 0
      ? messages
      : [{ role: 'user', content: prompt || 'Hello' }];

    // Build a single prompt preserving system and conversation
    let finalPrompt = '';
    if (system) finalPrompt += `System: ${system}\n\n`;
    for (const m of conversationMessages) {
      finalPrompt += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}\n`;
    }

    const body = {
      contents: [
        {
          parts: [
            { text: finalPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        candidateCount: 1,
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[interview] Gemini API error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error', detail: data });
    }

    const extractText = (d: any) => {
      if (!d) return null;
      const cand = d.candidates?.[0];
      if (cand) {
        const content = cand.content ?? cand.output ?? cand;
        if (content?.parts && Array.isArray(content.parts)) {
          return content.parts.map((p: any) => (typeof p === 'string' ? p : p.text ?? '')).join('');
        }
        if (Array.isArray(content)) {
          return content.map((c: any) => (c?.text ?? (typeof c === 'string' ? c : ''))).join('');
        }
        if (typeof content === 'string') return content;
      }
      if (d.output && Array.isArray(d.output) && d.output[0]?.content) {
        const first = d.output[0].content[0];
        if (first?.text) return first.text;
      }
      if (d?.text) return d.text;
      return null;
    };

    const text = extractText(data);
    if (!text) {
      console.error('[interview] Unexpected Gemini response shape', JSON.stringify(data));
      return res.status(502).json({ error: 'Unexpected Gemini response shape', detail: data });
    }

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('[interview] Unexpected server error:', error);
    return res.status(500).json({ error: error.message ?? 'Unknown server error' });
  }
}
