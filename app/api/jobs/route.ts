import { getD1 } from '@/db';
import { buildTopviewPrompt, TOPVIEW_ADAPTER, type TopviewGenerationResult } from '@/lib/topview-adapter';
import { isSafeExternalUrl } from '@/lib/products';
export async function GET() { try { const result = await getD1().prepare('SELECT * FROM generation_jobs ORDER BY created_at DESC LIMIT 50').all(); return Response.json({ jobs: result.results }); } catch { return Response.json({ jobs: [], source: 'demo' }); } }
export async function POST(request: Request) { try { const { code } = await request.json() as { code?: string }; if (!code) return Response.json({ error: '상품번호가 필요합니다.' }, { status: 400 }); const db = getD1(); const product = await db.prepare('SELECT * FROM products WHERE code = ?1 LIMIT 1').bind(code).first<any>(); if (!product) return Response.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 }); const timestamp = Date.now(); const prompt = buildTopviewPrompt({ productName: product.name }); const result = await db.prepare('INSERT INTO generation_jobs (product_id, status, prompt, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4) RETURNING id').bind(product.id, 'queued', prompt, timestamp).first<any>(); await db.prepare('UPDATE products SET status = ?1, updated_at = ?2 WHERE code = ?3').bind('queued', timestamp, code).run(); return Response.json({ job: { id: result?.id, code, status: 'queued', prompt, adapter: TOPVIEW_ADAPTER } }, { status: 201 }); } catch { return Response.json({ error: '작업 큐를 만들지 못했습니다. D1 연결을 확인해 주세요.' }, { status: 500 }); } }

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as TopviewGenerationResult & { jobId?: number; productId?: number };
    if (!body.jobId || !['queued', 'claimed', 'running', 'succeeded', 'failed'].includes(body.status)) return Response.json({ error: 'jobId와 유효한 상태가 필요합니다.' }, { status: 400 });
    if (body.resultUrl && !isSafeExternalUrl(body.resultUrl)) return Response.json({ error: 'resultUrl은 안전한 http(s) URL이어야 합니다.' }, { status: 400 });
    if (body.status === 'succeeded' && !body.resultUrl) return Response.json({ error: 'succeeded 상태에는 resultUrl이 필요합니다.' }, { status: 400 });
    const db = getD1();
    await db.prepare('UPDATE generation_jobs SET status = ?1, task_id = COALESCE(?2, task_id), canvas_id = COALESCE(?3, canvas_id), result_url = COALESCE(?4, result_url), error_message = COALESCE(?5, error_message), updated_at = ?6 WHERE id = ?7').bind(body.status, body.taskId ?? null, body.canvasId ?? null, body.resultUrl ?? null, body.errorMessage ?? null, Date.now(), body.jobId).run();
    if (body.productId) await db.prepare('UPDATE products SET status = ?1, video_url = COALESCE(?2, video_url), updated_at = ?3 WHERE id = ?4').bind(body.status === 'succeeded' ? 'ready' : body.status === 'failed' ? 'failed' : 'generating', body.resultUrl ?? null, Date.now(), body.productId).run();
    return Response.json({ ok: true });
  } catch { return Response.json({ error: '작업 상태를 갱신하지 못했습니다.' }, { status: 500 }); }
}
