import { NextResponse } from 'next/server';
import { researchProduct } from '@/lib/product-research';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string };
    if (!body.url) return NextResponse.json({ error: '상품 URL이 필요합니다.' }, { status: 400 });
    const result = await researchProduct(body.url);
    return NextResponse.json({ research: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '상품 조사를 실패했습니다.' }, { status: 422 });
  }
}
