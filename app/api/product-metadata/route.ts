import { fetchProductMetadata, ProductMetadataError } from '@/lib/product-metadata';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string };
    if (!body.url) return Response.json({ error: '상품 URL이 필요합니다.', code: 'invalid_url' }, { status: 400 });
    return Response.json(await fetchProductMetadata(body.url));
  } catch (error) {
    if (error instanceof ProductMetadataError) {
      const status = error.code === 'timeout' ? 504 : error.code === 'fetch_failed' ? 502 : 400;
      return Response.json({ error: error.message, code: error.code, manualInputRecommended: true }, { status });
    }
    return Response.json({ error: '상품 정보를 불러오지 못했습니다. 직접 입력해 주세요.', manualInputRecommended: true }, { status: 502 });
  }
}
