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
      // Using Gemini Flash model endpoint
      // NOTE: the API key is passed as a query parameter below
      prompt: {
        // 'contents' array per project convention — each item with a text field
        contents: [
          {
            type: 'text',
            text: finalPrompt,
          },
        ],
      },
      temperature: 0.2,
      maxOutputTokens: 1024,
      candidateCount: 1,
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

    // Extract text per the path provided: response.candidates[0].content.parts[0].text
    const text = data?.candidates?.[0]?.content?.parts?.[0] ?? (data?.candidates?.[0]?.content?.parts ?? []).join('') || '';
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('[chat] Unexpected server error:', error);
    return res.status(500).json({ error: error.message ?? 'Unknown server error' });
  }
}
