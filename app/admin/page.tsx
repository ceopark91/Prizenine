'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/app/components/site-header';

type Row = { code: string; name: string; marketplace: string; status: string };
type ApiResponse = { products?: Row[]; jobs?: unknown[]; error?: string };
const statuses: Record<string, string> = { draft: '초안', queued: '제작 대기', generating: '제작 중', ready: '완료', failed: '실패' };

export default function AdminPage() {
  const [message, setMessage] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [metadataBusy, setMetadataBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const reportRegistrationError = () => { if (!lifecycle.signal.aborted) setMessage('AI 작업 도구를 등록하지 못했습니다.'); };
    const register = async () => {
      await context.registerTool({
        name: 'list_products',
        title: '상품 목록 읽기',
        description: '현재 등록된 상품 목록과 상태를 읽습니다.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        async execute() {
          const response = await fetch('/api/products', { signal: lifecycle.signal });
          if (!response.ok) throw new Error('상품 목록을 읽지 못했습니다.');
          const data = await response.json() as ApiResponse;
          return { products: data.products ?? [] };
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'enqueue_topview_video',
        title: 'Topview 영상 작업 큐에 넣기',
        description: '6자리 상품번호의 외부 Topview 영상 제작 작업을 큐에 넣고 화면 상태를 갱신합니다. 이 작업은 외부 작업과 크레딧을 사용할 수 있습니다.',
        inputSchema: { type: 'object', properties: { productCode: { type: 'string', pattern: '^\\d{6}$' } }, required: ['productCode'], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          const productCode = typeof input === 'object' && input !== null && 'productCode' in input ? String((input as { productCode?: unknown }).productCode) : '';
          if (!/^\d{6}$/.test(productCode)) throw new Error('productCode는 6자리 숫자여야 합니다.');
          const response = await fetch('/api/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: productCode }), signal: lifecycle.signal });
          const data = await response.json() as { job?: { status?: string }; error?: string };
          if (!response.ok) throw new Error(data.error || '작업을 큐에 넣지 못했습니다.');
          setRows((current) => current.map((row) => row.code === productCode ? { ...row, status: data.job?.status || 'queued' } : row));
          setMessage(`${productCode} 영상 작업을 큐에 넣었습니다.`);
          return { productCode, status: data.job?.status || 'queued' };
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'list_pending_topview_jobs',
        title: '대기 중인 Topview 작업 읽기',
        description: 'queued, claimed, running 상태의 Topview 작업 상세를 읽습니다.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        async execute() {
          const pending = await Promise.all(['queued', 'claimed', 'running'].map((status) => fetch(`/api/jobs?status=${status}`, { signal: lifecycle.signal }).then(async (response) => { if (!response.ok) throw new Error('작업 목록을 읽지 못했습니다.'); return (await response.json() as { jobs?: unknown[] }).jobs ?? []; })));
          return { jobs: pending.flat() };
        },
      }, { signal: lifecycle.signal });
      await context.registerTool({
        name: 'update_topview_job',
        title: 'Topview 작업 상태 갱신',
        description: 'Topview 외부 작업의 상태와 결과를 저장합니다. 외부 작업 결과에 따라 크레딧 사용 및 비용이 발생할 수 있습니다.',
        inputSchema: { type: 'object', properties: { jobId: { type: 'integer', minimum: 1 }, status: { type: 'string', enum: ['queued', 'claimed', 'running', 'succeeded', 'failed'] }, taskId: { type: 'string' }, canvasId: { type: 'string' }, resultUrl: { type: 'string', format: 'uri' }, errorMessage: { type: 'string' } }, required: ['jobId', 'status'], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        async execute(input) {
          if (typeof input !== 'object' || input === null) throw new Error('작업 입력이 필요합니다.');
          const value = input as { jobId?: unknown; status?: unknown; taskId?: unknown; canvasId?: unknown; resultUrl?: unknown; errorMessage?: unknown };
          if (!Number.isInteger(value.jobId) || Number(value.jobId) < 1 || typeof value.status !== 'string') throw new Error('jobId와 status가 올바르지 않습니다.');
          const response = await fetch('/api/jobs', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jobId: value.jobId, status: value.status, taskId: value.taskId, canvasId: value.canvasId, resultUrl: value.resultUrl, errorMessage: value.errorMessage }), signal: lifecycle.signal });
          const data = await response.json() as { job?: { code?: string; status?: string }; error?: string };
          if (!response.ok) throw new Error(data.error || '작업 상태를 갱신하지 못했습니다.');
          if (data.job?.code && data.job.status) setRows((current) => current.map((row) => row.code === data.job?.code ? { ...row, status: data.job?.status || row.status } : row));
          setMessage(`작업 ${value.jobId} 상태를 갱신했습니다.`);
          return { jobId: value.jobId, status: data.job?.status || value.status };
        },
      }, { signal: lifecycle.signal });
    };
    void register().catch(reportRegistrationError);
    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/products').then((response) => response.json() as Promise<ApiResponse>),
      fetch('/api/jobs').then((response) => response.json() as Promise<ApiResponse>),
    ]).then(([productsData, jobsData]) => {
      if (!active) return;
      setRows(productsData.products ?? []);
      const jobCount = jobsData.jobs?.length ?? 0;
      if (jobCount) setMessage(`기존 상품과 영상 작업 ${jobCount}건을 불러왔습니다.`);
    }).catch(() => { if (active) setMessage('기존 데이터를 불러오지 못했습니다.'); });
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/products', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json() as { product?: Row; error?: string };
    setBusy(false);
    if (!response.ok || !data.product) { setMessage(data.error || '등록하지 못했습니다.'); return; }
    setRows((current) => [data.product as Row, ...current]); setMessage(`상품번호 ${data.product.code}로 등록했습니다.`); event.currentTarget.reset();
  }

  async function loadMetadata() {
    const form = formRef.current;
    const url = String(new FormData(form ?? undefined).get('sourceUrl') || '').trim();
    if (!url) { setMessage('먼저 상품 URL을 입력해 주세요.'); return; }
    setMetadataBusy(true); setMessage('상품 정보를 불러오는 중…');
    const response = await fetch('/api/product-metadata', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
    const data = await response.json() as { title?: string; imageUrl?: string; affiliateLikeSource?: boolean; error?: string };
    setMetadataBusy(false);
    if (!response.ok) { setMessage(data.error || '상품 정보를 불러오지 못했습니다. 직접 입력해 주세요.'); return; }
    const nameInput = form?.elements.namedItem('name') as HTMLInputElement | null;
    const imageInput = form?.elements.namedItem('imageUrl') as HTMLInputElement | null;
    if (nameInput && data.title) nameInput.value = data.title;
    if (imageInput && data.imageUrl) imageInput.value = data.imageUrl;
    setMessage(data.affiliateLikeSource ? '정보를 채웠습니다. 입력 URL이 제휴/파트너 링크일 수 있으니 제휴 링크를 별도로 확인해 주세요.' : '상품명과 대표 이미지를 채웠습니다. 제휴 링크는 별도로 확인해 주세요.');
  }

  async function createJob(code: string) { const response = await fetch('/api/jobs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) }); const data = await response.json() as { error?: string }; setMessage(response.ok ? `${code} 영상 작업을 큐에 넣었습니다.` : data.error || '작업을 만들지 못했습니다.'); }

  return <><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.15em] text-[var(--primary)]">STUDIO CONTROL</p><h1 className="display mt-2 text-4xl font-black">상품 등록 & 영상 큐</h1><p className="mt-3 text-[var(--muted-foreground)]">내부 운영 화면 · Topview 인증정보는 이 웹서버에 저장하지 않습니다.</p></div><Link href="/" className="hidden rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold sm:block">공개 페이지 보기</Link></div><div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><form ref={formRef} onSubmit={submit} className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-sm"><h2 className="text-lg font-black">새 상품</h2><div className="mt-5 space-y-4">{[['sourceUrl','상품 URL','https://www.coupang.com/...'],['name','상품명','운영자가 확인할 이름'],['imageUrl','대표 이미지 URL','https://...'],['affiliateUrl','제휴 링크 URL','https://...']].map(([name,label,placeholder]) => <label key={name} className="block text-sm font-bold">{label}<input required name={name} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[var(--ring)]" /></label>)}<button type="button" disabled={metadataBusy} onClick={loadMetadata} className="w-full rounded-xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm font-bold disabled:opacity-50">{metadataBusy ? '불러오는 중…' : '상품 URL 불러오기'}</button><p className="text-xs leading-5 text-[var(--muted-foreground)]">상품명·대표 이미지만 채웁니다. 원본 URL이 제휴 링크인지 확인하고, 제휴 링크는 별도로 입력해 주세요.</p><label className="block text-sm font-bold">설명<textarea name="description" placeholder="핵심 특징을 한두 문장으로 적어 주세요" rows={3} className="mt-2 w-full resize-none rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-[var(--ring)]" /></label><button disabled={busy} className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? '등록 중…' : '상품 등록'}</button>{message && <p aria-live="polite" className="rounded-xl bg-[var(--muted)] px-4 py-3 text-sm font-semibold">{message}</p>}</div></form><section className="rounded-[1.5rem] border border-[var(--border)] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-black">최근 상품 / 작업 상태</h2><span className="text-xs text-[var(--muted-foreground)]">Topview adapter queue</span></div>{rows.length === 0 ? <div className="mt-5 rounded-xl bg-[var(--muted)] p-8 text-center text-sm text-[var(--muted-foreground)]">등록한 상품이 여기에 표시됩니다.</div> : <div className="mt-5 space-y-3">{rows.map((row) => <div key={row.code} className="flex flex-col gap-3 rounded-xl border border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-[var(--primary)]">{row.code} · {row.marketplace}</p><p className="font-bold">{row.name}</p></div><div className="flex items-center gap-3"><span className="text-sm text-[var(--muted-foreground)]">{statuses[row.status] ?? row.status}</span><button onClick={() => createJob(row.code)} className="rounded-lg bg-[var(--muted)] px-3 py-2 text-sm font-bold">영상 만들기</button></div></div>)}</div>}</section></div></main></>;
}
