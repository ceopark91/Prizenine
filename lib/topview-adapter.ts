export type TopviewJobStatus = 'queued' | 'claimed' | 'running' | 'succeeded' | 'failed';

export type TopviewGenerationRequest = {
  productCode: string;
  productName: string;
  imageUrl: string;
  language: 'ko';
  aspectRatio: '9:16';
  durationSeconds: { min: 15; max: 25 };
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

export function buildTopviewPrompt(input: Pick<TopviewGenerationRequest, 'productName'>) {
  return `ecommerce-product-video: ${input.productName}. Korean language, 9:16 vertical, 15-25 seconds, informative review style, show the typed original product image in every product scene, include a clear CTA. Do not invent price, discount, shipping, or performance claims.`;
}
