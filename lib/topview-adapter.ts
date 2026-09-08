export type TopviewJobStatus = 'queued' | 'claimed' | 'running' | 'succeeded' | 'failed';

export type TopviewGenerationRequest = {
  productCode: string;
  productName: string;
  imageUrl: string;
  language: 'ko';
  aspectRatio: '9:16' | 'source';
  generationMode: 'direct_video' | 'canvas';
  taskType: 'image_to_video' | 'text_to_video';
  durationSeconds: 15;
  style: 'informative-review';
  includeCta: true;
};

export type TopviewGenerationResult = {
  status: TopviewJobStatus;
  taskId?: string;
  canvasId?: string;
  resultUrl?: string;
  errorMessage?: string;
};

/**
 * Web requests only persist this contract in generation_jobs. A local,
 * OAuth-authenticated Codex worker owns the actual Topview MCP call.
 */
export const TOPVIEW_ADAPTER = 'topview-mcp-worker';
export const TOPVIEW_DEFAULTS = { generationMode: 'direct_video' as const, duration: 15 as const };
export function aspectRatioForTaskType(taskType: TopviewGenerationRequest['taskType']) { return taskType === 'image_to_video' ? 'source' as const : '9:16' as const; }

const allowedTransitions: Record<TopviewJobStatus, TopviewJobStatus[]> = { queued: ['queued', 'claimed', 'running', 'failed'], claimed: ['claimed', 'running', 'failed'], running: ['running', 'succeeded', 'failed'], succeeded: ['succeeded'], failed: ['failed'] };
export function isAllowedStatusTransition(from: TopviewJobStatus, to: TopviewJobStatus) { return allowedTransitions[from]?.includes(to) ?? false; }
export function productStatusForJobStatus(status: TopviewJobStatus) { return { productStatus: status === 'succeeded' ? 'ready' : status === 'failed' ? 'failed' : status === 'queued' ? 'queued' : 'generating', jobStatus: status }; }
export function isUniqueConstraintError(error: unknown) { return error instanceof Error && /unique|constraint/i.test(error.message); }

export function buildTopviewPrompt(input: Pick<TopviewGenerationRequest, 'productName'> & Pick<TopviewGenerationRequest, 'taskType'>) {
  return `direct_video / ${input.taskType}: ${input.productName}. Korean language, exactly 15 seconds, informative review style, ${input.taskType === 'image_to_video' ? 'use the typed original product image and follow its source aspect ratio; do not send an aspectRatio field' : 'use the product description without inventing unsupported visual claims and use 9:16'}, include a clear CTA. Do not invent price, discount, shipping, or performance claims. Use Canvas mode only when a longer or multi-scene generation is explicitly requested.`;
}
