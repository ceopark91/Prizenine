import { SiteHeader, Disclosure } from '@/components/site-header';
import { ProductCard } from '@/components/product-card';
import { getAllProducts } from '@/lib/data';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const all = await getAllProducts();

  const query = q?.trim() ?? '';
  const products = query
    ? all.filter((p) => p.code === query)
    : all;

  return (
    <>
      <SiteHeader />
      <main className="grain mx-auto min-h-[calc(100vh-73px)] max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-[var(--primary)]">
              PRODUCT PICK / 2026
            </p>
            <h1 className="display max-w-xl text-4xl font-black leading-[1.08] sm:text-6xl">
              숫자 하나로,
              <br />
              <span className="text-[var(--primary)]">괜찮은 물건</span>을
              찾으세요.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--muted-foreground)]">
              짧은 리뷰와 실제 상품 링크를 한 곳에 모았습니다. 마음에 드는
              상품의 번호를 검색해 보세요.
            </p>
          </div>
          <form
            action="/"
            method="get"
            className="rounded-[1.5rem] border border-[var(--border)] bg-white p-3 shadow-[0_16px_45px_rgba(28,42,76,.08)]"
          >
            <label htmlFor="q" className="mb-2 block px-3 text-sm font-bold">
              상품번호 검색
            </label>
            <div className="flex gap-2">
              <input
                id="q"
                name="q"
                inputMode="numeric"
                defaultValue={query}
                placeholder="예: 240101"
                className="min-w-0 flex-1 rounded-xl bg-[var(--muted)] px-4 py-3 outline-none ring-[var(--primary)] focus:ring-2"
              />
              <button
                className="rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white"
                type="submit"
              >
                찾기
              </button>
            </div>
          </form>
        </section>

        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--primary)]">
                LATEST PICKS
              </p>
              <h2 className="display mt-1 text-2xl font-black">
                {query
                  ? `상품번호 ${query} 검색 결과`
                  : '최근 등록된 상품'}
              </h2>
            </div>
            <span className="hidden text-xs font-semibold text-[var(--muted-foreground)] sm:block">
              {products.length}개 상품
            </span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/60 p-10 text-center">
              <p className="font-bold">검색 결과가 없습니다.</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                상품번호를 다시 확인해 주세요.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.code} product={product} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-16 border-t border-[var(--border)] pt-6">
          <Disclosure />
        </div>
      </main>
    </>
  );
}
