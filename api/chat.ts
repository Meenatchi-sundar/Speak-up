import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, system, messages } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[chat] Missing GEMINI_API_KEY environment variable');
      return res.status(500).json({ error: 'Missing Gemini API Key on server' });
    }

    // Build a single prompt string preserving system/messages content
    let finalPrompt = '';
    if (system) finalPrompt += `System: ${system}\n\n`;
    if (messages && Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        finalPrompt += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}\n`;
      }
    } else if (prompt) {
      finalPrompt += `User: ${prompt}`;
    }

    const body = {
      // Top-level contents array with parts per Gemini spec
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[chat] Gemini API error:', JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error', detail: data });
    }

    // Robust extraction: handle several possible Gemini response shapes
    const extractText = (d: any) => {
      if (!d) return null;
      // candidates -> content -> parts
      const cand = d.candidates?.[0];
      if (cand) {
        const content = cand.content ?? cand.output ?? cand;
        // content may be object with parts array
        if (content?.parts && Array.isArray(content.parts)) {
          return content.parts.map((p: any) => (typeof p === 'string' ? p : p.text ?? '')).join('');
        }
        // content may be array of objects
        if (Array.isArray(content)) {
          return content.map((c: any) => (c?.text ?? (typeof c === 'string' ? c : ''))).join('');
        }
        // content may be string
        if (typeof content === 'string') return content;
      }
      // output style: d.output[0].content[0].text
      if (d.output && Array.isArray(d.output) && d.output[0]?.content) {
        const first = d.output[0].content[0];
        if (first?.text) return first.text;
      }
      // direct text field
      if (d?.text) return d.text;
      return null;
    };

    const text = extractText(data);
    if (!text) {
      console.error('[chat] Unexpected Gemini response shape', JSON.stringify(data));
      return res.status(502).json({ error: 'Unexpected Gemini response shape', detail: data });
    }

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('[chat] Unexpected server error:', error);
    return res.status(500).json({ error: error.message ?? 'Unknown server error' });
  }
}
