import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.SEND_FROM_EMAIL || `SpeakUp Practice <no-reply@${process.env.VERCEL_URL || 'example.com'}>`;
  const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL || 'your-app.vercel.app'}`;

  if (!apiKey) {
    console.error('[send-welcome] Missing RESEND_API_KEY');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const subject = 'Welcome to SpeakUp Practice!';
  const html = `
    <div style="font-family:Inter, Arial, sans-serif; color:#1F2937;">
      <h2 style="color:#3B7A57;">Welcome${name ? `, ${name}` : ''}!</h2>
      <p>Registration successful! 🎉 Hope you have a wonderful and enjoyable experience. See you there!</p>
      <p style="margin-top:12px">Here's a quick overview of what you'll learn:</p>
      <ul>
        <li><strong>Grammar &amp; Tenses</strong></li>
        <li><strong>Vocabulary &amp; Words</strong></li>
        <li><strong>Communication &amp; Speaking</strong></li>
        <li><strong>Interview &amp; Group Discussion</strong></li>
        <li><strong>Writing</strong></li>
      </ul>
      <p>Use the <strong>Ask Anything You Want</strong> feature on the Dashboard to get instant help with any English question.</p>
      <p style="margin-top:18px"><a href="${appUrl}" style="background:#3B7A57;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;">Start Learning</a></p>
      <p style="font-size:12px;color:#6B7280;margin-top:18px;">If you did not sign up for this account, you can safely ignore this email.</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject,
        html
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[send-welcome] Resend error', response.status, text);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('[send-welcome] Unexpected error', err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
}
