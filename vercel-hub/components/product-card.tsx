import Link from 'next/link';
import type { Product } from '@/lib/types';
import { MARKETPLACE_NAMES, STATUS_NAMES } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const marketplace = product.marketplace;
  return (
    <Link
      href={`/p/${product.code}`}
      className="group overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-white shadow-[0_12px_40px_rgba(28,42,76,.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(28,42,76,.12)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl || '/favicon.svg'}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[var(--primary)]">
          {product.code}
        </div>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
          <span>{MARKETPLACE_NAMES[marketplace] ?? marketplace}</span>
          <span>{STATUS_NAMES[product.status] ?? product.status}</span>
        </div>
        <h2 className="display text-xl font-bold leading-tight">
          {product.name}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {product.description}
        </p>
      </div>
    </Link>
  );
}
