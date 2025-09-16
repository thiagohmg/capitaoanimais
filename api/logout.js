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
  setCookie(res, 'session', '', { Path: '/', HttpOnly: true, SameSite: 'Lax', Secure: true, MaxAge: 0 });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};