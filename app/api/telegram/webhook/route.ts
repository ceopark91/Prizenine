import { POST as ingest } from '@/app/api/ingest/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) { return ingest(req); }
