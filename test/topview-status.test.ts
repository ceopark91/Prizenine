import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedStatusTransition } from '@/lib/topview-adapter';

test('allows only the documented Topview job transitions', () => {
  assert.equal(isAllowedStatusTransition('queued', 'claimed'), true);
  assert.equal(isAllowedStatusTransition('running', 'succeeded'), true);
  assert.equal(isAllowedStatusTransition('queued', 'succeeded'), false);
  assert.equal(isAllowedStatusTransition('succeeded', 'running'), false);
  assert.equal(isAllowedStatusTransition('failed', 'failed'), true);
});
