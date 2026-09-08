export type TopviewJobStatus = 'queued' | 'claimed' | 'running' | 'succeeded' | 'failed';

export type TopviewGenerationRequest = {
  productCode: string;
  productName: string;
  imageUrl: string;
  language: 'ko';
  aspectRatio: '9:16';
  generationMode: 'direct_video' | 'canvas';
  taskType: 'image_to_video' | 'text_to_video';
  durationSeconds: 15;
  style: 'informative-review';
  includeCta: true;
};

export type TopviewGenerationResult = {
  status: Extract<TopviewJobStatus, 'succeeded' | 'failed'>;
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
export const TOPVIEW_DEFAULTS = { generationMode: 'direct_video' as const, aspectRatio: '9:16' as const, duration: 15 as const };

export function buildTopviewPrompt(input: Pick<TopviewGenerationRequest, 'productName'> & Pick<TopviewGenerationRequest, 'taskType'>) {
  return `direct_video / ${input.taskType}: ${input.productName}. Korean language, 9:16 vertical, exactly 15 seconds, informative review style, ${input.taskType === 'image_to_video' ? 'use the typed original product image' : 'use the product description without inventing unsupported visual claims'}, include a clear CTA. Do not invent price, discount, shipping, or performance claims. Use Canvas mode only when a longer or multi-scene generation is explicitly requested.`;
}
