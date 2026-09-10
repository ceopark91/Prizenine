const URL_RE = /https?:\/\/[^\s<>"']+/i;
const { APPS_SCRIPT_URL } = require('../config/apps-script');
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = typeof req.body === 'string' ? { text: req.body } : (req.body || {});
  const match = String(body.url || body.text || body.message || body.content || '').match(URL_RE);
  if (!match) return res.status(400).json({ error: '상품 URL을 찾을 수 없습니다.' });
  const url = match[0].replace(/[),.]+$/, '');
  const target = APPS_SCRIPT_URL;
  if (!target) return res.status(503).json({ error: 'Google Apps Script가 설정되지 않았습니다.' });
  const response = await fetch(target, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({url, receivedAt:new Date().toISOString(), source:body.source || 'public-trigger'}) });
  if (!response.ok) return res.status(502).json({ error:'Google Sheets 전달 실패' });
  return res.status(202).json({ok:true,status:'queued',url});
};
