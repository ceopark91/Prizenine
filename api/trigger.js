const URL_RE = /https?:\/\/[^\s<>"']+/i;
const { APPS_SCRIPT_URL } = require('../config/apps-script');
const { postAppsScript } = require('./apps-script-post');

function extractUrl(value) {
  const match = String(value || '').match(URL_RE);
  return match ? match[0].replace(/[),.]+$/, '') : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const expected = process.env.TRIGGER_SECRET || process.env.INGEST_TOKEN;
  const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.headers['x-trigger-secret'] || req.headers['x-telegram-bot-api-secret-token'] || req.query?.secret;
  if (!expected || supplied !== expected) return res.status(401).json({ error: 'Unauthorized' });
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (_) { return { text: req.body }; } })() : (req.body || {});
  const url = extractUrl(body.url || body.text || body.message?.text || body.message || body.content || body.body);
  if (!url) return res.status(400).json({ error: '상품 URL을 찾을 수 없습니다.' });
  let research = {};
  try {
    const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `https://${req.headers.host}`;
    const result = await fetch(`${origin}/api/research`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
    if (result.ok) research = await result.json();
  } catch (_) {}
  const payload = { ...research, url, receivedAt: new Date().toISOString(), source: body.source || 'trigger' };
  const sheetUrl = APPS_SCRIPT_URL;
  if (sheetUrl) {
    const response = await postAppsScript(sheetUrl, payload);
    if (!response.ok) return res.status(502).json({ error: 'Google Sheets 전달 실패' });
  }
  return res.status(202).json({ ok: true, status: 'queued', url, forwardedToSheet: Boolean(sheetUrl) });
};
