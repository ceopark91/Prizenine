import { collectReviews } from '@/lib/review-crawler';
import { aggregateReviews } from '@/lib/review-analysis';

export async function POST(request: Request) {
  try { const body = await request.json() as { url?: string; reviews?: unknown[] }; const reviews = Array.isArray(body.reviews) ? body.reviews as never[] : await collectReviews(body.url || ''); return Response.json({ source: body.url, analysis: aggregateReviews(reviews) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : '리뷰 분석에 실패했습니다.' }, { status: 400 }); }
}
