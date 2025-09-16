const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signPayload(payloadObj, secret, expSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { ...payloadObj, iat: now, exp: now + expSeconds };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64url(payloadStr);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${payloadB64}.${signature}`;
}

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

function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.Path) parts.push(`Path=${options.Path}`);
  if (options.HttpOnly) parts.push('HttpOnly');
  if (options.SameSite) parts.push(`SameSite=${options.SameSite}`);
  if (options.Secure) parts.push('Secure');
  if (options.MaxAge !== undefined) parts.push(`Max-Age=${options.MaxAge}`);
  if (options.Domain) parts.push(`Domain=${options.Domain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server not configured' }));
    return;
  }

  let body = '';
  await new Promise(resolve => {
    req.on('data', chunk => (body += chunk));
    req.on('end', resolve);
  });

  let data;
  try {
    data = JSON.parse(body || '{}');
  } catch (e) {
    data = {};
  }

  const code = (data.code || '').toString().trim();
  if (!/^[0-9]{6}$/.test(code)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Código inválido' }));
    return;
  }

  const cookies = parseCookies(req);
  const verif = cookies['verif'];
  if (!verif) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Verificação expirada' }));
    return;
  }

  const payload = verifyToken(verif, secret);
  if (!payload) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Verificação inválida' }));
    return;
  }

  const codeHash = crypto.createHmac('sha256', secret).update(code).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(payload.codeHash))) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Código incorreto' }));
    return;
  }

  // Criar sessão
  const session = signPayload({ email: payload.email, name: payload.name || '' }, secret, 30 * 24 * 60 * 60); // 30 dias
  // Limpar cookie de verificação e setar sessão
  setCookie(res, 'verif', '', { Path: '/', HttpOnly: true, SameSite: 'Lax', Secure: true, MaxAge: 0 });
  setCookie(res, 'session', session, { Path: '/', HttpOnly: true, SameSite: 'Lax', Secure: true, MaxAge: 30 * 24 * 60 * 60 });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};