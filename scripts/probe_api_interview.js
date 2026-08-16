import https from 'https';
const data = JSON.stringify({ prompt: 'probe' });
let attempts = 0;
function tryOnce() {
  attempts++;
  const opts = {
    method: 'POST',
    hostname: 'speakup-practice-three.vercel.app',
    path: '/api/interview',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };
  const req = https.request(opts, (res) => {
    console.log(new Date().toISOString(), 'status', res.statusCode);
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      console.log('body', body || '<empty>');
      if (res.statusCode !== 405) process.exit(0);
      if (attempts < 12) setTimeout(tryOnce, 5000);
      else process.exit(1);
    });
  });
  req.on('error', (e) => {
    console.error('err', e.message);
    if (attempts < 12) setTimeout(tryOnce, 5000);
    else process.exit(1);
  });
  req.write(data);
  req.end();
}
tryOnce();
