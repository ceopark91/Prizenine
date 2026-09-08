import assert from 'node:assert/strict';
import test from 'node:test';
import { generateProductCode } from '@/lib/products';

test('generates six-digit product codes without time-based collisions', () => {
  assert.equal(generateProductCode(() => 0), '100000');
  assert.equal(generateProductCode(() => 0.999999), '999999');
  assert.match(generateProductCode(), /^\d{6}$/);
});
