import assert from 'node:assert/strict';
import { aggregateReviews, analyzeReview } from '@/lib/review-analysis';
import { genericJsonLdAdapter } from '@/lib/review-crawler';
import { test } from 'node:test';

test('individual review analysis keeps evidence and topics', () => { const result = analyzeReview({ id: '1', text: '사용하기 간편하고 조용해서 만족합니다. 다만 용량이 작다.', rating: 4, sourceUrl: 'https://example.com' }); assert.equal(result.sentiment, 'mixed'); assert.ok(result.topics.includes('사용성')); assert.ok(result.cons.length > 0); });
test('aggregate ranks recurring pros and cons', () => { const result = aggregateReviews([{ id: '1', text: '가성비가 좋아요', sourceUrl: 'x' }, { id: '2', text: '가성비가 좋아요. 다만 소음이 있어요.', sourceUrl: 'x' }]); assert.equal(result.total, 2); assert.ok(result.pros[0].mentions >= 1); assert.ok(result.cons.length > 0); });
test('json-ld adapter is reusable across sources', () => { const html = '<script type="application/ld+json">{"review":[{"reviewBody":"배송이 빠르고 좋아요","reviewRating":{"ratingValue":5}}]}</script>'; assert.equal(genericJsonLdAdapter.collect('https://example.com/p', html).length, 1); });
