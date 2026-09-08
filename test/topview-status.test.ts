import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedStatusTransition, productStatusForJobStatus } from '@/lib/topview-adapter';

test('allows only the documented Topview job transitions', () => {
  assert.equal(isAllowedStatusTransition('queued', 'claimed'), true);
  assert.equal(isAllowedStatusTransition('running', 'succeeded'), true);
  assert.equal(isAllowedStatusTransition('queued', 'succeeded'), false);
  assert.equal(isAllowedStatusTransition('succeeded', 'running'), false);
  assert.equal(isAllowedStatusTransition('failed', 'failed'), true);
});

test('keeps job status and product status as separate SQL bindings', () => {
  assert.deepEqual(productStatusForJobStatus('running'), { productStatus: 'generating', jobStatus: 'running' });
  assert.deepEqual(productStatusForJobStatus('succeeded'), { productStatus: 'ready', jobStatus: 'succeeded' });
});
