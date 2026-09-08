import { NextResponse } from 'next/server';
import { getJob, updateJob } from '@/lib/jobs';
export const runtime = 'nodejs';
function ok(req: Request) { const token = process.env.INGEST_TOKEN; return !!token && req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') === token; }
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) { if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const { id } = await params; const job = await getJob(id); return job ? NextResponse.json({ job }) : NextResponse.json({ error: 'Not found' }, { status: 404 }); }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) { if (!ok(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const { id } = await params; const job = await updateJob(id, await req.json().catch(() => ({}))); return job ? NextResponse.json({ job }) : NextResponse.json({ error: 'Not found' }, { status: 404 }); }
