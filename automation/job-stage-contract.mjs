/**
 * Canonical PrizeNine queue contract.
 *
 * A job may never be terminalized merely because a background worker lacks
 * the chat-bound Topview MCP session.  Every non-terminal job must expose one
 * concrete next action, so scheduler runs cannot silently skip it.
 */
export const ACTIVE_STAGES = Object.freeze([
  'RECEIVED', 'DIGGING_DONE', 'SHEET_DONE', 'SCRIPT_READY', 'REVIEW_APPROVED',
  'VIDEO_SUBMITTING', 'VIDEO_GENERATING', 'VIDEO_VERIFYING'
]);

export const STAGE_PRIORITY = Object.freeze([
  'VIDEO_VERIFYING', 'VIDEO_SUBMITTING', 'REVIEW_APPROVED', 'SCRIPT_READY',
  'SHEET_DONE', 'DIGGING_DONE', 'RECEIVED', 'VIDEO_GENERATING'
]);

const hasText = value => typeof value === 'string' && value.trim().length > 0;
const hasMediaBindings = generation =>
  hasText(generation?.canvasId) && Array.isArray(generation?.mediaNodeIds)
  && generation.mediaNodeIds.length > 0;

export function requiredActionForJob(job) {
  const generation = job?.generation || {};
  const stage = job?.stage;

  if (stage === 'REVIEW_APPROVED') {
    if (!hasMediaBindings(generation)) {
      return {
        code: 'PREPARE_TOPVIEW_MEDIA',
        owner: 'chat_topview_mcp',
        terminal: false,
        message: '검증된 판매자 이미지를 Topview Canvas 미디어 노드로 준비해야 합니다.'
      };
    }
    if (!hasText(generation.taskId)) {
      return {
        code: 'SUBMIT_TOPVIEW_TASK',
        owner: 'chat_topview_mcp',
        terminal: false,
        message: 'Canvas 미디어가 준비되었습니다. 현재 채팅의 인증된 Topview MCP로 제출해야 합니다.'
      };
    }
  }

  if (stage === 'VIDEO_SUBMITTING' && !hasText(generation.taskId)) {
    return {
      code: 'REPAIR_SUBMISSION_RECEIPT',
      owner: 'automation_repair',
      terminal: false,
      message: '제출 단계에는 Topview taskId 또는 submissionId가 반드시 있어야 합니다.'
    };
  }

  if ((stage === 'VIDEO_GENERATING' || stage === 'VIDEO_VERIFYING') && !hasText(generation.taskId)) {
    return {
      code: 'REPAIR_MISSING_TASK_ID',
      owner: 'automation_repair',
      terminal: false,
      message: '영상 생성/검증 단계에는 Topview taskId가 반드시 있어야 합니다.'
    };
  }

  return { code: 'ADVANCE_STAGE', owner: 'queue_worker', terminal: false, message: '현재 단계를 검증하여 다음 단계로 진행합니다.' };
}

export function summarizeQueueJob(job) {
  const images = job.review?.images || job.research?.images || [];
  const scenes = job.script?.scenes || [];
  return {
    jobId: job.id,
    status: job.status,
    stage: job.stage,
    revision: job.revision ?? 0,
    productNumber: job.product_number,
    url: job.url,
    updatedAt: job.updated_at,
    autoProduction: job.review?.autoProduction === true,
    approvedAt: job.review?.approvedAt || null,
    imageCount: Array.isArray(images) ? images.length : 0,
    sceneCount: Array.isArray(scenes) ? scenes.length : 0,
    taskId: job.generation?.taskId || null,
    error: job.error || null,
    requiredAction: requiredActionForJob(job)
  };
}
