import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchProductMetadata, parseProductMetadataHtml, ProductMetadataError } from '@/lib/product-metadata';

test('parses Open Graph title/image and canonical links', () => {
  const html = '<html><head><meta property="og:title" content="테스트 상품"><meta property="og:image" content="/hero.jpg"><link rel="canonical" href="/product/1"></head></html>';
  assert.deepEqual(parseProductMetadataHtml(html, 'https://www.coupang.com/vp/products/1'), {
    title: '테스트 상품',
    imageUrl: 'https://www.coupang.com/hero.jpg',
    canonicalUrl: 'https://www.coupang.com/product/1',
  });
});

test('fetches only an allowed final marketplace URL', async () => {
  const response = new Response('<title>상품</title>', { status: 200, headers: { 'content-type': 'text/html' } });
  Object.defineProperty(response, 'url', { value: 'https://www.coupang.com/vp/products/1' });
  const metadata = await fetchProductMetadata('https://www.coupang.com/vp/products/1', async () => response);
  assert.equal(metadata.marketplace, 'coupang');
  assert.equal(metadata.title, '상품');
  assert.equal(metadata.affiliateLikeSource, false);
});

test('rejects a redirect outside the marketplace', async () => {
  const response = new Response('<title>bad</title>', { status: 200 });
  Object.defineProperty(response, 'url', { value: 'https://example.com/redirected' });
  await assert.rejects(() => fetchProductMetadata('https://www.coupang.com/vp/products/1', async () => response), (error: ProductMetadataError) => error.code === 'blocked_url');
});
