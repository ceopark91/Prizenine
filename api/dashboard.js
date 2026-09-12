const { APPS_SCRIPT_URL } = require('../config/apps-script');

module.exports = async function handler(req, res) {
  if (!APPS_SCRIPT_URL) return res.status(500).json({ ok: false, error: 'APPS_SCRIPT_URL_MISSING' });
  try {
    const params = new URLSearchParams(req.query || {});
    const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
    const init = { method: req.method === 'POST' ? 'POST' : 'GET', redirect: 'follow', headers: { 'content-type': 'application/json' } };
    if (req.method === 'POST') init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const upstream = await fetch(url, init);
    const text = await upstream.text();
    res.status(upstream.status).setHeader('content-type', 'application/json; charset=utf-8').send(text);
  } catch (error) {
    res.status(502).json({ ok: false, error: 'APPS_SCRIPT_PROXY_FAILED', detail: String(error.message || error) });
  }
};
