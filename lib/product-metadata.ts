import { marketplaceFromUrl, isMarketplaceUrl, isSafeExternalUrl } from '@/lib/products';

export const METADATA_MAX_BYTES = 1_000_000;
export const METADATA_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 5;
const redirectStatuses = new Set([301, 302, 303, 307, 308]);

export type ProductMetadata = {
  title?: string;
  imageUrl?: string;
  canonicalUrl?: string;
  finalUrl: string;
  marketplace: string;
  affiliateLikeSource: boolean;
};

export class ProductMetadataError extends Error {
  constructor(public readonly code: 'invalid_url' | 'blocked_url' | 'timeout' | 'too_large' | 'fetch_failed', message: string) {
    super(message);
    this.name = 'ProductMetadataError';
  }
}

function clean(value: string | undefined) {
  return value?.replace(/\s+/g, ' ').trim() || undefined;
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function metaContent(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i');
  const match = html.match(pattern);
  return clean(decodeHtml(match?.[1] || match?.[2] || ''));
}

export function parseProductMetadataHtml(html: string, baseUrl: string) {
  const title = metaContent(html, 'og:title') || clean(decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''));
  const image = metaContent(html, 'og:image');
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>|<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  return {
    title,
    imageUrl: image ? new URL(image, baseUrl).toString() : undefined,
    canonicalUrl: canonical ? new URL(canonical[1] || canonical[2], baseUrl).toString() : undefined,
  };
}

function isAffiliateLikeSource(value: string) {
  const parsed = new URL(value);
  return /cpng|partner|affiliate|link\.coupang/i.test(`${parsed.hostname}${parsed.pathname}`);
}

async function readLimited(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) return response.text();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) throw new ProductMetadataError('too_large', '상품 페이지가 너무 큽니다.');
    chunks.push(value);
  }
  return chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join('') + decoder.decode();
}

export async function fetchProductMetadata(inputUrl: string, fetcher: typeof fetch = fetch): Promise<ProductMetadata> {
  if (!isSafeExternalUrl(inputUrl)) throw new ProductMetadataError('invalid_url', '안전한 http(s) URL을 입력해 주세요.');
  let marketplace: string;
  try { marketplace = marketplaceFromUrl(inputUrl); } catch { throw new ProductMetadataError('invalid_url', '쿠팡, 테무, 알리익스프레스 상품 URL만 지원합니다.'); }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), METADATA_TIMEOUT_MS);
  try {
    let currentUrl = inputUrl;
    let response: Response | undefined;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      response = await fetcher(currentUrl, { redirect: 'manual', signal: controller.signal, headers: { accept: 'text/html,application/xhtml+xml' } });
      if (!redirectStatuses.has(response.status)) break;
      const location = response.headers.get('location');
      if (!location) throw new ProductMetadataError('blocked_url', '리다이렉트 응답에 Location이 없습니다.');
      if (hop === MAX_REDIRECTS) throw new ProductMetadataError('blocked_url', '리다이렉트 횟수가 너무 많습니다.');
      let nextUrl: string;
      try { nextUrl = new URL(location, currentUrl).toString(); } catch { throw new ProductMetadataError('blocked_url', '잘못된 리다이렉트 주소입니다.'); }
      if (!isMarketplaceUrl(nextUrl, marketplace)) throw new ProductMetadataError('blocked_url', '리다이렉트 대상이 허용된 마켓 도메인이 아닙니다.');
      currentUrl = nextUrl;
    }
    if (!response) throw new ProductMetadataError('fetch_failed', '상품 페이지를 불러오지 못했습니다.');
    const finalUrl = response.url || currentUrl;
    if (!isMarketplaceUrl(finalUrl, marketplace)) throw new ProductMetadataError('blocked_url', '최종 URL이 허용된 마켓 도메인이 아닙니다.');
    if (!response.ok) throw new ProductMetadataError('fetch_failed', `상품 페이지를 불러오지 못했습니다. (${response.status})`);
    const html = await readLimited(response, METADATA_MAX_BYTES);
    const parsed = parseProductMetadataHtml(html, finalUrl);
    return { ...parsed, finalUrl, marketplace, affiliateLikeSource: isAffiliateLikeSource(inputUrl) };
  } catch (error) {
    if (error instanceof ProductMetadataError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') throw new ProductMetadataError('timeout', '상품 페이지 응답 시간이 초과되었습니다.');
    throw new ProductMetadataError('fetch_failed', '상품 페이지를 불러오지 못했습니다. 직접 입력해 주세요.');
  } finally { clearTimeout(timer); }
}
