import assert from 'node:assert/strict';
import { requiredActionForJob } from './job-stage-contract.mjs';

assert.equal(requiredActionForJob({ stage: 'REVIEW_APPROVED' }).code, 'PREPARE_TOPVIEW_MEDIA');
assert.equal(requiredActionForJob({ stage: 'REVIEW_APPROVED', generation: { canvasId: 'canvas', mediaNodeIds: ['image-node'] } }).code, 'SUBMIT_TOPVIEW_TASK');
assert.equal(requiredActionForJob({ stage: 'VIDEO_SUBMITTING' }).code, 'REPAIR_SUBMISSION_RECEIPT');
assert.equal(requiredActionForJob({ stage: 'VIDEO_GENERATING' }).code, 'REPAIR_MISSING_TASK_ID');
assert.equal(requiredActionForJob({ stage: 'VIDEO_GENERATING', generation: { taskId: 'task' } }).code, 'ADVANCE_STAGE');
console.log('job-stage-contract: ok');
