import { NextResponse } from 'next/server';
import { createJob, listJobs } from '@/lib/jobs';
export const runtime = 'nodejs';
function ok(req: Request) { const token = process.env.INGEST_TOKEN; return !!token && (req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') === token || req.headers.get('x-ingest-token') === token); }
export async function GET(req: Request) { if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); return NextResponse.json({ jobs: await listJobs() }); }
export async function POST(req: Request) { if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const b = await req.json().catch(() => ({})); if (!b.productCode || !b.sourceUrl) return NextResponse.json({ error: 'productCode와 sourceUrl이 필요합니다.' }, { status: 400 }); return NextResponse.json({ job: await createJob(b) }, { status: 201 }); }
