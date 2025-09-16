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

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const secret = process.env.JWT_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  if (!secret || !resendKey) {
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

  const email = (data.email || '').toString().trim().toLowerCase();
  const name = (data.name || '').toString().trim();
  if (!validEmail(email)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Email inválido' }));
    return;
  }

  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const codeHash = crypto.createHmac('sha256', secret).update(code).digest('hex');
  const token = signPayload({ email, codeHash, name }, secret, 10 * 60); // 10 min

  // Cookie de verificação
  setCookie(res, 'verif', token, {
    Path: '/',
    HttpOnly: true,
    SameSite: 'Lax',
    Secure: true,
    MaxAge: 10 * 60
  });

  const host = (req.headers['x-forwarded-host'] || req.headers.host || 'www.montacesta.com.br').toString();
  const proto = 'https';
  const magicLink = `${proto}://${host}/account.html?token=${encodeURIComponent(token)}`;

  // Enviar e-mail via Resend REST API
  try {
    const subject = 'Seu código de verificação - Capitão Animais';
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#111">
        <p>Olá${name ? `, ${name}` : ''}!</p>
        <p>Seu código de verificação é:</p>
        <p style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</p>
        <p>Você também pode entrar diretamente clicando neste link:</p>
        <p><a href="${magicLink}">${magicLink}</a></p>
        <p>O código expira em 10 minutos.</p>
      </div>
    `;

    const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject,
        html
      })
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('Resend error', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Falha ao enviar e-mail' }));
  }
};