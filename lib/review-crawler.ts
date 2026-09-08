import { isSafeExternalUrl } from '@/lib/products';
import type { ReviewRecord } from '@/lib/review-analysis';

export type ReviewSourceAdapter = { canHandle(url: string): boolean; collect(url: string, html: string): ReviewRecord[] };
export const REVIEW_MAX_BYTES = 3_000_000;
export const REVIEW_TIMEOUT_MS = 10_000;

function stripHtml(value: string) { return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(); }
function attr(tag: string, name: string) { return tag.match(new RegExp(`${name}=["']([^"']+)`, 'i'))?.[1]; }

export const genericJsonLdAdapter: ReviewSourceAdapter = {
  canHandle: () => true,
  collect(url, html) {
    const result: ReviewRecord[] = [];
    const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const block of blocks) { try { const value = JSON.parse(block[1]); const items = Array.isArray(value) ? value : [value]; for (const item of items) { const reviews = item.review || item.reviews || []; for (const review of (Array.isArray(reviews) ? reviews : [reviews])) { if (review?.reviewBody) result.push({ id: String(review.reviewId || `${result.length + 1}`), text: String(review.reviewBody), title: review.name, author: review.author?.name || review.author, date: review.datePublished, rating: Number(review.reviewRating?.ratingValue) || undefined, sourceUrl: url }); } } } catch { /* malformed JSON-LD is ignored */ } }
    return result;
  },
};

export async function collectReviews(url: string, fetcher: typeof fetch = fetch) {
  if (!isSafeExternalUrl(url)) throw new Error('안전한 http(s) URL이 필요합니다.');
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), REVIEW_TIMEOUT_MS);
  try { const response = await fetcher(url, { signal: controller.signal, headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'TopviewPickReviewResearch/1.0 (+contact required)' } }); if (!response.ok) throw new Error(`리뷰 페이지 요청 실패 (${response.status})`); const html = await response.text(); if (new TextEncoder().encode(html).byteLength > REVIEW_MAX_BYTES) throw new Error('리뷰 페이지가 너무 큽니다.'); return genericJsonLdAdapter.collect(url, html); } finally { clearTimeout(timer); }
}
