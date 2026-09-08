import { NextResponse } from 'next/server';
import { getAllProducts, addProduct } from '@/lib/data';
import { sheetsEnabled } from '@/lib/sheets';
import type { RowInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json({ products, sheetsEnabled: sheetsEnabled() });
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as RowInput & { url?: string };
    const submittedUrl = raw.url || raw.sourceUrl || raw.affiliateUrl || '';
    if (!submittedUrl) {
      return NextResponse.json(
        { error: '상품 URL 또는 파트너스 링크가 필요합니다.' },
        { status: 400 },
      );
    }
    const body: RowInput = {
      ...raw,
      sourceUrl: raw.sourceUrl || submittedUrl,
      affiliateUrl: raw.affiliateUrl || submittedUrl,
      name: raw.name || '상품 정보 수집 대기',
      description: raw.description || '상품 페이지에서 상세 정보를 수집합니다.',
      imageUrl: raw.imageUrl || '',
      status: raw.status || 'queued',
    };
    const product = await addProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : '등록 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
