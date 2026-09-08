import { google } from 'googleapis';
import { addProduct, getProductByCode } from './data';
import type { Product, RowInput, ProductStatus } from './types';

export const JOBS_SHEET_NAME = '_jobs';
export const JOB_HEADERS = ['job_id','product_code','source_url','status','task_id','board_id','storyboard','error','created_at','updated_at','mail_sent_at'] as const;
export type JobStatus = 'queued' | 'generating' | 'ready' | 'failed';
export type VideoJob = {
  jobId: string; productCode: string; sourceUrl: string; status: JobStatus;
  taskId: string; boardId: string; storyboard: string; error: string;
  createdAt: string; updatedAt: string; mailSentAt: string;
};

const id = process.env.GOOGLE_SHEET_ID;
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = process.env.GOOGLE_PRIVATE_KEY;
function auth() {
  if (!id || !email || !key) throw new Error('Google Sheets 설정이 없습니다.');
  return new google.auth.GoogleAuth({ credentials: { client_email: email, private_key: key.replace(/\\n/g, '\n') }, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
}
async function api() { return google.sheets({ version: 'v4', auth: await auth() as any }); }
async function ensureJobsSheet(sheets: any) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id!, fields: 'sheets(properties(sheetId,title))' });
  const found = meta.data.sheets?.find((s: any) => s.properties?.title === JOBS_SHEET_NAME);
  if (!found) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: id!, requestBody: { requests: [{ addSheet: { properties: { title: JOBS_SHEET_NAME } } }] } });
    await sheets.spreadsheets.values.update({ spreadsheetId: id!, range: `${JOBS_SHEET_NAME}!A1:K1`, valueInputOption: 'RAW', requestBody: { values: [JOB_HEADERS as unknown as string[]] } });
  } else {
    const h = await sheets.spreadsheets.values.get({ spreadsheetId: id!, range: `${JOBS_SHEET_NAME}!A1:K1` });
    if (!h.data.values?.[0]?.length) await sheets.spreadsheets.values.update({ spreadsheetId: id!, range: `${JOBS_SHEET_NAME}!A1:K1`, valueInputOption: 'RAW', requestBody: { values: [JOB_HEADERS as unknown as string[]] } });
  }
}
const parse = (v: any[]) => ({ jobId: String(v[0] || ''), productCode: String(v[1] || ''), sourceUrl: String(v[2] || ''), status: (v[3] || 'queued') as JobStatus, taskId: String(v[4] || ''), boardId: String(v[5] || ''), storyboard: String(v[6] || ''), error: String(v[7] || ''), createdAt: String(v[8] || ''), updatedAt: String(v[9] || ''), mailSentAt: String(v[10] || '') });

export async function listJobs(): Promise<VideoJob[]> {
  const sheets = await api(); await ensureJobsSheet(sheets);
  const r = await sheets.spreadsheets.values.get({ spreadsheetId: id!, range: `${JOBS_SHEET_NAME}!A2:K1000` });
  return (r.data.values || []).map(parse).filter((j: VideoJob) => j.jobId);
}
export async function getJob(jobId: string) { return (await listJobs()).find(j => j.jobId === jobId) || null; }
export async function createJob(input: { productCode: string; sourceUrl: string; storyboard?: string; status?: JobStatus; taskId?: string; boardId?: string }) {
  const sheets = await api(); await ensureJobsSheet(sheets); const now = new Date().toISOString(); const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const row = [jobId, input.productCode, input.sourceUrl, input.status || 'queued', input.taskId || '', input.boardId || '', input.storyboard || '', '', now, now, ''];
  await sheets.spreadsheets.values.append({ spreadsheetId: id!, range: `${JOBS_SHEET_NAME}!A:K`, valueInputOption: 'RAW', requestBody: { values: [row] } });
  return parse(row);
}
export async function updateJob(jobId: string, patch: Partial<Omit<VideoJob, 'jobId'>>) {
  const sheets = await api(); await ensureJobsSheet(sheets); const jobs = await listJobs(); const i = jobs.findIndex(j => j.jobId === jobId); if (i < 0) return null;
  const next = { ...jobs[i], ...patch, updatedAt: new Date().toISOString() }; await sheets.spreadsheets.values.update({ spreadsheetId: id!, range: `${JOBS_SHEET_NAME}!A${i+2}:K${i+2}`, valueInputOption: 'RAW', requestBody: { values: [[next.jobId,next.productCode,next.sourceUrl,next.status,next.taskId,next.boardId,next.storyboard,next.error,next.createdAt,next.updatedAt,next.mailSentAt]] } }); return next;
}
/** 상품 행을 먼저 추가하고, 배열수식으로 계산된 A열 번호를 재조회한 뒤 작업을 연결한다. */
export async function ingestProductAndCreateJob(input: RowInput, sourceUrl: string, storyboard = '') {
  const product = await addProduct({ ...input, affiliateUrl: input.affiliateUrl || sourceUrl, sourceUrl, status: 'queued' });
  let resolved: Product | null = product;
  for (let attempt = 0; attempt < 5; attempt++) { resolved = await getProductByCode(product.code); if (resolved?.code) break; await new Promise(r => setTimeout(r, 250)); }
  return createJob({ productCode: resolved?.code || product.code, sourceUrl, storyboard });
}
