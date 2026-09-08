'use client';

import { useEffect, useState } from 'react';
import type { Product, Marketplace } from '@/lib/types';
import { MARKETPLACE_NAMES, STATUS_NAMES } from '@/lib/types';

const blankForm = {
  marketplace: 'coupang' as Marketplace,
  sourceUrl: '',
  affiliateUrl: '',
  name: '',
  description: '',
  imageUrl: '',
  videoUrl: '',
  status: 'draft' as Product['status'],
};

export function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(blankForm);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sheets')
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch((err) => setMessage(`목록 불러오기 실패: ${err.message}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool({
        name: 'list_pending_topview_products',
        title: 'Topview 대기 상품 읽기',
        description: 'Google Sheets에서 아직 영상이 없거나 제작 중인 상품을 읽습니다.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        async execute() {
          const response = await fetch('/api/sheets', { signal: lifecycle.signal });
          if (!response.ok) throw new Error('상품 목록을 읽지 못했습니다.');
          const data = (await response.json()) as { products?: Product[] };
          return { products: (data.products ?? []).filter((product) => product.status !== 'ready' || !product.videoUrl) };
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'update_topview_product',
        title: 'Topview 결과를 시트에 저장',
        description: 'Topview 외부 작업 상태와 영상 URL을 Google Sheets에 저장합니다. 유료 생성은 별도 Topview 도구 호출에서 발생합니다.',
        inputSchema: { type: 'object', properties: { code: { type: 'string' }, status: { type: 'string', enum: ['draft', 'queued', 'generating', 'ready', 'failed'] }, videoUrl: { type: 'string', format: 'uri' } }, required: ['code', 'status'], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          if (typeof input !== 'object' || input === null) throw new Error('상품 상태 입력이 필요합니다.');
          const value = input as { code?: unknown; status?: unknown; videoUrl?: unknown };
          if (typeof value.code !== 'string' || typeof value.status !== 'string') throw new Error('code와 status가 필요합니다.');
          const response = await fetch(`/api/sheets/${encodeURIComponent(value.code)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: value.status, videoUrl: value.videoUrl }), signal: lifecycle.signal });
          const data = (await response.json()) as { product?: Product; error?: string };
          if (!response.ok) throw new Error(data.error || '시트 갱신에 실패했습니다.');
          setProducts((current) => current.map((product) => product.code === value.code ? data.product ?? product : product));
          return { code: value.code, status: data.product?.status ?? value.status, videoUrl: data.product?.videoUrl ?? null };
        },
      }, { signal: lifecycle.signal });
    };
    void register();
    return () => lifecycle.abort();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || '등록 실패');
      return;
    }
    setProducts((prev) => [data.product, ...prev]);
    setForm(blankForm);
    setMessage(`상품 ${data.product.code} 등록 완료`);
  }

  async function setStatus(code: string, status: Product['status']) {
    const res = await fetch(`/api/sheets/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || '상태 변경 실패');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.code === code ? data.product : p)),
    );
    setMessage(`상품 ${code} 상태 → ${STATUS_NAMES[status] ?? status}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
      {/* 등록 폼 */}
      <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_12px_40px_rgba(28,42,76,.06)]">
        <h2 className="display text-xl font-black">상품 등록</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          쿠팡·테무·알리 상품 URL을 넣으면 숫자 상품번호가 자동 발급됩니다.
        </p>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className="block text-sm font-bold">
            마켓플레이스
            <select
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5"
              value={form.marketplace}
              onChange={(e) =>
                setForm({ ...form, marketplace: e.target.value as Marketplace })
              }
            >
              {Object.entries(MARKETPLACE_NAMES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            상품 URL
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              value={form.sourceUrl}
              required
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              placeholder="https://www.coupang.com/vp/products/..."
            />
          </label>
          <label className="block text-sm font-bold">
            제휴 URL (구매 버튼이 이동할 주소)
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              value={form.affiliateUrl}
              required
              onChange={(e) =>
                setForm({ ...form, affiliateUrl: e.target.value })
              }
              placeholder="https://link.coupang.com/..."
            />
          </label>
          <label className="block text-sm font-bold">
            상품명
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block text-sm font-bold">
            설명
            <textarea
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <label className="block text-sm font-bold">
            대표 이미지 URL
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <label className="block text-sm font-bold">
            영상 URL (선택, 완성 시)
            <input
              className="mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://..."
            />
          </label>

          {message && (
            <p className="rounded-xl bg-[var(--muted)] px-3 py-2 text-sm">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="rounded-xl bg-[var(--primary)] px-5 py-3 font-bold text-white"
          >
            상품 등록
          </button>
        </form>
      </section>

      {/* 상품 목록 + 상태 */}
      <section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-[0_12px_40px_rgba(28,42,76,.06)]">
        <h2 className="display text-xl font-black">등록 상품</h2>
        {loading ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            불러오는 중...
          </p>
        ) : products.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            아직 등록된 상품이 없습니다. Google Sheets가 설정되면 목록이
            표시됩니다.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {products.map((p) => (
              <li
                key={p.code}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[var(--primary)] ring-1 ring-[var(--border)]">
                        #{p.code}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {MARKETPLACE_NAMES[p.marketplace] ?? p.marketplace}
                      </span>
                    </div>
                    <p className="mt-2 font-bold">{p.name}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--muted-foreground)]">
                      {p.sourceUrl}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[var(--muted-foreground)]">
                    상태:
                  </span>
                  {(Object.keys(STATUS_NAMES) as Product['status'][]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(p.code, s)}
                        className={
                          p.status === s
                            ? 'rounded-full bg-[var(--primary)] px-3 py-1 font-bold text-white'
                            : 'rounded-full bg-white px-3 py-1 ring-1 ring-[var(--border)] hover:bg-[var(--muted)]'
                        }
                      >
                        {STATUS_NAMES[s]}
                      </button>
                    ),
                  )}
                </div>
                {p.videoUrl && (
                  <a
                    href={p.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-bold text-[var(--primary)] underline"
                  >
                    영상 보기
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
