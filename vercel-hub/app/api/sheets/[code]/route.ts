import { NextResponse } from 'next/server';
import { editProduct } from '@/lib/data';
import type { RowInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  try {
    const body = (await req.json()) as Partial<RowInput>;
    const product = await editProduct(code, body);
    if (!product) {
      return NextResponse.json(
        { error: `상품 ${code}을 찾을 수 없습니다.` },
        { status: 404 },
      );
    }
    return NextResponse.json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : '갱신 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
