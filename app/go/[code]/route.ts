import { NextResponse } from 'next/server';
import { getProductByCode } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const product = await getProductByCode(code);

  if (!product || !product.affiliateUrl) {
    return NextResponse.redirect(new URL('/', _req.url));
  }

  // 클릭 집계 기록 (비동기, 차단하지 않음)
  recordClick(code).catch((err) =>
    console.error('클릭 기록 실패:', err),
  );

  return NextResponse.redirect(product.affiliateUrl, 302);
}

async function recordClick(code: string) {
  // MVP: 콘솔 기록. 추후 Google Sheets / 방문자 지표 시트에 집계 연동.
  console.log(`[click] code=${code} at=${new Date().toISOString()}`);
}
