export type ProductResearch = {
  sourceUrl: string;
  title: string;
  description: string;
  brand: string;
  imageUrl: string;
  price: string;
  rating: string;
  reviewCount: string;
  reviewSnippets: string[];
  evidence: string[];
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i');
  return clean(html.match(pattern)?.[1]);
}

function jsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => { try { const value = JSON.parse(match[1]); return Array.isArray(value) ? value : [value]; } catch { return []; } });
}

function asProduct(value: any): any {
  if (!value || typeof value !== 'object') return null;
  if (String(value['@type'] || '').toLowerCase().includes('product')) return value;
  return Array.isArray(value['@graph']) ? value['@graph'].find((item: any) => String(item?.['@type'] || '').toLowerCase().includes('product')) : null;
}

export async function researchProduct(sourceUrl: string): Promise<ProductResearch> {
  const url = new URL(sourceUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('HTTP 상품 URL만 조사할 수 있습니다.');
  const response = await fetch(url, { headers: { 'user-agent': 'PrizeNineProductResearch/1.0 (+public-page-only)' }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`상품 페이지 응답 오류(${response.status})`);
  const html = await response.text();
  const product = jsonLd(html).map(asProduct).find(Boolean) ?? {};
  const brand = clean(typeof product.brand === 'object' ? product.brand.name : product.brand);
  const image = clean(Array.isArray(product.image) ? product.image[0] : product.image) || meta(html, 'og:image');
  const aggregate = product.aggregateRating || {};
  const reviews = Array.isArray(product.review) ? product.review : product.review ? [product.review] : [];
  const reviewSnippets = reviews.map((review: any) => clean(review.reviewBody || review.name)).filter(Boolean).slice(0, 8);
  const result: ProductResearch = {
    sourceUrl: response.url,
    title: clean(product.name) || meta(html, 'og:title') || clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
    description: clean(product.description) || meta(html, 'description') || meta(html, 'og:description'),
    brand,
    imageUrl: image,
    price: clean(product.offers?.price || product.offers?.lowPrice),
    rating: clean(aggregate.ratingValue),
    reviewCount: clean(aggregate.reviewCount || aggregate.ratingCount),
    reviewSnippets,
    evidence: [product.name ? 'JSON-LD Product' : '', brand ? 'JSON-LD brand' : '', aggregate.ratingValue ? 'JSON-LD aggregateRating' : '', reviewSnippets.length ? 'JSON-LD review' : '', image ? '상품 이미지/OG 이미지' : ''].filter(Boolean),
  };
  if (!result.title) throw new Error('상품명을 공개 페이지에서 확인하지 못했습니다.');
  return result;
}
