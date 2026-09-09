function clean(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
function meta(html, key, attr = 'property') {
  const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i');
  const alt = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key}["'][^>]*>`, 'i');
  return (html.match(re) || html.match(alt) || [])[1] || '';
}
function jsonLd(html) {
  const out = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const parsed = JSON.parse(match[1].trim()); out.push(...(Array.isArray(parsed) ? parsed : [parsed])); } catch (_) { /* malformed public markup */ }
  }
  return out.find((x) => x && (x['@type'] === 'Product' || (Array.isArray(x['@type']) && x['@type'].includes('Product')))) || {};
}
function reviewAnalysis(reviews) {
  const rows = reviews.map((review, index) => {
    const text = `${review.title || ''} ${review.text || review.review || ''}`.replace(/\s+/g, ' ').trim();
    const positive = ['좋', '만족', '추천', '편하', '간편', '튼튼', '빠르', '가성비'].filter((word) => text.includes(word)).length + (Number(review.rating) >= 4 ? 2 : 0);
    const negative = ['아쉽', '불편', '비싸', '고장', '소음', '시끄', '늦', '부족', '냄새', '누수', '별로'].filter((word) => text.includes(word)).length + (Number(review.rating) <= 2 ? 2 : 0);
    const sentiment = positive && negative ? 'mixed' : positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral';
    return { id: String(review.id || index + 1), text, rating: review.rating || null, sentiment, evidence: text.split(/[.!?。！？]+/).filter(Boolean).slice(0, 3) };
  });
  return { total: rows.length, analyzed: rows.length, sentiment: rows.reduce((out, row) => { out[row.sentiment] += 1; return out; }, { positive: 0, negative: 0, mixed: 0, neutral: 0 }), reviews: rows };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch (_) { return {}; } })() : (req.body || {});
  if (Array.isArray(body.reviews)) return res.status(200).json({ source: body.url || 'browser-session', mode: 'browser-session', analysis: reviewAnalysis(body.reviews) });
  let target;
  try { target = new URL(body.url); } catch (_) { return res.status(400).json({ error: '유효한 URL이 필요합니다.' }); }
  if (!/^https?:$/.test(target.protocol)) return res.status(400).json({ error: 'HTTP URL만 허용됩니다.' });
  try {
    const response = await fetch(target, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; PrizeNResearch/1.0)' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return res.status(response.status === 403 ? 409 : 502).json({ error: `상품 페이지 응답 오류 (${response.status})`, code: response.status === 403 ? 'blocked_automated_access' : 'fetch_failed', nextSteps: response.status === 403 ? ['official_api', 'browser_session', 'approved_public_source', 'approved_coupang_adapter'] : [] });
    const html = await response.text();
    const product = jsonLd(html);
    const offers = Array.isArray(product.offers) ? product.offers[0] : (product.offers || {});
    const aggregate = product.aggregateRating || {};
    const snippets = [...html.matchAll(/(?:review|후기|리뷰)[^<>]{0,120}/gi)].slice(0, 5).map((m) => clean(m[0])).filter(Boolean);
    const result = { url: target.toString(), title: clean(product.name || meta(html, 'og:title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]), brand: clean(typeof product.brand === 'object' ? product.brand.name : product.brand), description: clean(product.description || meta(html, 'description', 'name') || meta(html, 'og:description')), image: Array.isArray(product.image) ? product.image[0] : (product.image || meta(html, 'og:image')), price: offers.price || '', rating: aggregate.ratingValue || '', reviewCount: aggregate.reviewCount || aggregate.ratingCount || '', reviewSnippets: snippets };
    return res.status(200).json(result);
  } catch (error) { return res.status(502).json({ error: '공개 상품 페이지를 읽지 못했습니다.', detail: error.name === 'TimeoutError' ? 'timeout' : undefined }); }
};
