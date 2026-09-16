import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256, validateProjection, makeReceipt, renderPreview } from '../src/projection.mjs';

function fixture(overrides = {}) {
  const payload = overrides.payload ?? 'preview-ok';
  return {
    version: 'PREVIEW_PROJECTION_V1',
    generation: 1,
    profile: 'WEB_PREVIEW',
    idempotencyKey: 'a'.repeat(64),
    payload,
    payloadDigest: sha256(payload),
    ...overrides,
  };
}

test('accepts a bounded projection', () => {
  const value = validateProjection(fixture());
  assert.equal(value.profile, 'WEB_PREVIEW');
});

test('rejects a modified payload', () => {
  assert.throws(() => validateProjection(fixture({ payload: 'changed' })), /PAYLOAD_DIGEST_MISMATCH/);
});

test('rejects an unknown profile', () => {
  assert.throws(() => validateProjection(fixture({ profile: 'SHELL' })), /PROFILE_NOT_ALLOWED/);
});

test('receipt is deterministic', () => {
  const first = makeReceipt(fixture());
  const second = makeReceipt(fixture());
  assert.deepEqual(first, second);
  assert.match(first.resultDigest, /^[a-f0-9]{64}$/);
});

test('preview escapes active markup', () => {
  const payload = '<script>alert(1)</script>';
  const html = renderPreview(fixture({ payload, payloadDigest: sha256(payload) }));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
});
