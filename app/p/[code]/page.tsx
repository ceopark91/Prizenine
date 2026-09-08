import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader, Disclosure } from '@/components/site-header';
import { getProductByCode } from '@/lib/data';
import { MARKETPLACE_NAMES, STATUS_NAMES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const product = await getProductByCode(code);
  return {
    title: product ? `${product.name} — 탑뷰 픽` : '상품을 찾을 수 없습니다',
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const product = await getProductByCode(code);
  if (!product) notFound();

  return (
    <>
      <SiteHeader />
      <main className="grain mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]"
        >
          ← 전체 상품 보기
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
          {/* 9:16 영상 영역 */}
          <div className="mx-auto w-full max-w-[380px]">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-black shadow-[0_16px_45px_rgba(28,42,76,.15)]">
              {product.videoUrl ? (
                <video
                  key={product.videoUrl}
                  className="aspect-[9/16] w-full object-cover"
                  src={product.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  poster={product.imageUrl || undefined}
                />
              ) : (
                <div className="relative aspect-[9/16] w-full bg-[var(--muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl || '/favicon.svg'}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                      <span className="text-2xl">▶</span>
                    </div>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                      {STATUS_NAMES[product.status] ?? product.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 설명 + 구매 */}
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--primary)] ring-1 ring-[var(--border)]">
                #{product.code}
              </span>
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                {MARKETPLACE_NAMES[product.marketplace] ?? product.marketplace}
              </span>
            </div>
            <h1 className="display mt-4 text-3xl font-black leading-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
              {product.description}
            </p>

            <a
              href={`/go/${product.code}`}
              className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-4 text-lg font-black text-white transition hover:opacity-95"
            >
              구매하러 가기
              <span aria-hidden>→</span>
            </a>
            <p className="mt-3 text-center text-xs text-[var(--muted-foreground)]">
              ▸ 운영자/리뷰 영상과 함께 확인한 상품입니다.
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-6">
          <Disclosure />
        </div>
      </main>
    </>
  );
}
