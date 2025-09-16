const crypto = require('crypto');

function verifyToken(token, secret) {
  try {
    const [payloadB64, signature] = token.split('.');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
    const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
    const payload = JSON.parse(json);
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((acc, part) => {
    const [k, v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v || '');
    return acc;
  }, {});
}

module.exports = async (req, res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server not configured' }));
    return;
  }
  const cookies = parseCookies(req);
  const token = cookies['session'];
  if (!token) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }
  const payload = verifyToken(token, secret);
  if (!payload) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ authenticated: true, email: payload.email, name: payload.name || '' }));
};