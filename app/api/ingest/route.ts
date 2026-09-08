import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getAllProducts } from '@/lib/data';
import { ingestProductAndCreateJob } from '@/lib/jobs';
import type { RowInput } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_RE = /https?:\/\/[^\s<>"'`]+/gi;

function sameSecret(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function authorized(req: Request, telegram = false) {
  const expected = telegram ? process.env.TELEGRAM_WEBHOOK_SECRET : process.env.INGEST_TOKEN;
  const provided = telegram
    ? req.headers.get('x-telegram-bot-api-secret-token')
    : req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || req.headers.get('x-ingest-token');
  return sameSecret(provided, expected);
}

function extractUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  const match = value.match(URL_RE)?.[0];
  return match?.replace(/[),.!?]+$/, '') || null;
}

async function ingest(req: Request, telegram: boolean) {
  if (!authorized(req, telegram)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const text = telegram ? body?.message?.text || body?.edited_message?.text : body?.text || body?.message || body?.url;
  const url = extractUrl(text) || extractUrl(body?.affiliateUrl);
  if (!url) return NextResponse.json({ error: '상품 URL을 찾을 수 없습니다.' }, { status: 400 });

  const products = await getAllProducts();
  const existing = products.find((p) => p.affiliateUrl === url || p.sourceUrl === url);
  if (existing) return NextResponse.json({ product: existing, duplicate: true, status: existing.status });

  const input: RowInput = {
    name: body?.name || 'URL 상품 조사 대기',
    description: body?.description || '상품 페이지를 확인해 장단점과 설명을 작성합니다.',
    affiliateUrl: url,
    imageUrl: body?.imageUrl || '',
    videoUrl: null,
    status: 'queued',
  };
  const job = await ingestProductAndCreateJob(input, url);
  const product = (await getAllProducts()).find((item) => item.code === job.productCode) ?? null;
  return NextResponse.json({ product, job, duplicate: false, status: 'queued' }, { status: 201 });
}

export async function POST(req: Request) { return ingest(req, Boolean(req.headers.get('x-telegram-bot-api-secret-token'))); }

export async function PUT(req: Request) { return ingest(req, false); }
