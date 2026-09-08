import { getD1 } from '@/db';
import { isSafeExternalUrl } from '@/lib/products';
import { aspectRatioForTaskType, buildTopviewPrompt, isAllowedStatusTransition, TOPVIEW_ADAPTER, TOPVIEW_DEFAULTS, type TopviewGenerationResult, type TopviewJobStatus } from '@/lib/topview-adapter';

const statuses: TopviewJobStatus[] = ['queued', 'claimed', 'running', 'succeeded', 'failed'];
function validStatus(value: unknown): value is TopviewJobStatus { return typeof value === 'string' && statuses.includes(value as TopviewJobStatus); }
function jobShape(row: any) { const taskType = row.image_url ? 'image_to_video' : 'text_to_video'; return { jobId: row.job_id, productId: row.product_id, code: row.code, name: row.name, sourceUrl: row.source_url, imageUrl: row.image_url, affiliateUrl: row.affiliate_url, prompt: row.prompt, status: row.job_status, taskId: row.task_id, canvasId: row.canvas_id, resultUrl: row.result_url, generationMode: TOPVIEW_DEFAULTS.generationMode, taskType, aspectRatio: aspectRatioForTaskType(taskType), duration: TOPVIEW_DEFAULTS.duration }; }
const joinedSelect = 'SELECT j.id AS job_id, p.id AS product_id, p.code, p.name, p.source_url, p.image_url, p.affiliate_url, j.prompt, j.status AS job_status, j.task_id, j.canvas_id, j.result_url, j.error_message FROM generation_jobs j JOIN products p ON p.id = j.product_id';

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('status');
  if (requested && !validStatus(requested)) return Response.json({ error: '허용되지 않은 작업 상태입니다.' }, { status: 400 });
  try {
    const db = getD1();
    const result = requested ? await db.prepare(`${joinedSelect} WHERE j.status = ?1 ORDER BY j.created_at DESC LIMIT 50`).bind(requested).all() : await db.prepare(`${joinedSelect} ORDER BY j.created_at DESC LIMIT 50`).all();
    return Response.json({ jobs: result.results.map(jobShape) });
  } catch { return Response.json({ jobs: [], source: 'demo' }); }
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json() as { code?: string };
    if (!code) return Response.json({ error: '상품번호가 필요합니다.' }, { status: 400 });
    const db = getD1();
    const product = await db.prepare('SELECT * FROM products WHERE code = ?1 LIMIT 1').bind(code).first<any>();
    if (!product) return Response.json({ error: '상품을 찾을 수 없습니다.' }, { status: 404 });
    const timestamp = Date.now();
    const taskType = product.image_url ? 'image_to_video' : 'text_to_video';
    const prompt = buildTopviewPrompt({ productName: product.name, taskType });
    const result = await db.prepare('INSERT INTO generation_jobs (product_id, status, prompt, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4) RETURNING id').bind(product.id, 'queued', prompt, timestamp).first<any>();
    await db.prepare('UPDATE products SET status = ?1, updated_at = ?2 WHERE code = ?3').bind('queued', timestamp, code).run();
    return Response.json({ job: { id: result?.id, code, status: 'queued', prompt, adapter: TOPVIEW_ADAPTER, generationMode: TOPVIEW_DEFAULTS.generationMode, taskType, aspectRatio: aspectRatioForTaskType(taskType), duration: TOPVIEW_DEFAULTS.duration } }, { status: 201 });
  } catch { return Response.json({ error: '작업 큐를 만들지 못했습니다. D1 연결을 확인해 주세요.' }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as TopviewGenerationResult & { jobId?: number };
    if (!body.jobId || !validStatus(body.status)) return Response.json({ error: 'jobId와 유효한 상태가 필요합니다.' }, { status: 400 });
    if (body.resultUrl && !isSafeExternalUrl(body.resultUrl)) return Response.json({ error: 'resultUrl은 안전한 http(s) URL이어야 합니다.' }, { status: 400 });
    if (body.status === 'succeeded' && !body.resultUrl) return Response.json({ error: 'succeeded 상태에는 resultUrl이 필요합니다.' }, { status: 400 });
    const db = getD1();
    const current = await db.prepare('SELECT j.status, j.product_id, j.task_id, j.result_url FROM generation_jobs j WHERE j.id = ?1 LIMIT 1').bind(body.jobId).first<any>();
    if (!current) return Response.json({ error: '작업을 찾을 수 없습니다.' }, { status: 404 });
    if (!isAllowedStatusTransition(current.status as TopviewJobStatus, body.status)) return Response.json({ error: `허용되지 않은 상태 전이입니다: ${current.status} → ${body.status}` }, { status: 409 });
    if ((body.status === 'running' || body.status === 'succeeded') && !(body.taskId || current.task_id)) return Response.json({ error: `${body.status} 상태에는 taskId가 필요합니다.` }, { status: 400 });
    const timestamp = Date.now();
    const productStatus = body.status === 'succeeded' ? 'ready' : body.status === 'failed' ? 'failed' : body.status === 'queued' ? 'queued' : 'generating';
    const jobUpdate = db.prepare('UPDATE generation_jobs SET status = ?1, task_id = COALESCE(?2, task_id), canvas_id = COALESCE(?3, canvas_id), result_url = COALESCE(?4, result_url), error_message = COALESCE(?5, error_message), updated_at = ?6 WHERE id = ?7 AND status = ?8').bind(body.status, body.taskId ?? null, body.canvasId ?? null, body.resultUrl ?? null, body.errorMessage ?? null, timestamp, body.jobId, current.status);
    const productUpdate = db.prepare('UPDATE products SET status = ?1, video_url = COALESCE(?2, video_url), updated_at = ?3 WHERE id = ?4 AND EXISTS (SELECT 1 FROM generation_jobs WHERE id = ?5 AND status = ?1)').bind(productStatus, body.resultUrl ?? null, timestamp, current.product_id, body.jobId);
    const results = await db.batch([jobUpdate, productUpdate]);
    if (!results[0]?.meta?.changes) {
      const afterRace = await db.prepare('SELECT j.status, j.product_id FROM generation_jobs j WHERE j.id = ?1 LIMIT 1').bind(body.jobId).first<any>();
      if (!afterRace || afterRace.status !== body.status) return Response.json({ error: '다른 작업자가 먼저 상태를 변경했습니다.' }, { status: 409 });
    }
    const updated = await db.prepare(`${joinedSelect} WHERE j.id = ?1 LIMIT 1`).bind(body.jobId).first<any>();
    return Response.json({ ok: true, job: updated ? jobShape(updated) : { jobId: body.jobId, status: body.status } });
  } catch { return Response.json({ error: '작업 상태를 갱신하지 못했습니다.' }, { status: 500 }); }
}
