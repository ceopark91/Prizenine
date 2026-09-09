const URL_RE = /https?:\/\/[^\s<>"']+/gi;

function json(status, body) {
  return { status, headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) };
}

function extractUrl(value) {
  const match = String(value || '').match(URL_RE);
  return match ? match[0].replace(/[),.]+$/, '') : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const expected = process.env.INGEST_TOKEN;
  const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!expected || supplied !== expected) return res.status(401).json({ error: 'Unauthorized' });
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (_) { return {}; } })() : (req.body || {});
  const url = extractUrl(body.url || body.text || body.message || body.content);
  if (!url) return res.status(400).json({ error: '상품 URL을 찾을 수 없습니다.' });
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'HTTP URL만 허용됩니다.' });
  const reviews = Array.isArray(body.reviews) ? body.reviews.slice(0, 100) : undefined;
  const payload = { url, receivedAt: new Date().toISOString(), source: body.source || 'api', reviewMode: reviews ? 'browser-session' : 'url-only', reviews };
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) return res.status(502).json({ error: 'Google Sheets 전달 실패' });
  }
  return res.status(202).json({ ok: true, status: 'queued', url, forwardedToSheet: Boolean(process.env.GOOGLE_APPS_SCRIPT_URL) });
};
