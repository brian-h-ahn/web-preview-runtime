import { createHash } from 'node:crypto';

export const POLICY = Object.freeze({
  version: 'PREVIEW_PROJECTION_V1',
  allowedProfiles: ['STATIC_CHECK', 'WEB_PREVIEW'],
  maxPayloadBytes: 32768,
});

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function validateProjection(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('PROJECTION_INVALID');
  if (input.version !== POLICY.version) throw new Error('VERSION_MISMATCH');
  if (!Number.isInteger(input.generation) || input.generation < 1) throw new Error('GENERATION_INVALID');
  if (!POLICY.allowedProfiles.includes(input.profile)) throw new Error('PROFILE_NOT_ALLOWED');
  if (typeof input.idempotencyKey !== 'string' || !/^[a-f0-9]{64}$/.test(input.idempotencyKey)) throw new Error('IDEMPOTENCY_KEY_INVALID');
  if (typeof input.payload !== 'string') throw new Error('PAYLOAD_REQUIRED');
  if (Buffer.byteLength(input.payload, 'utf8') > POLICY.maxPayloadBytes) throw new Error('PAYLOAD_TOO_LARGE');
  const payloadDigest = sha256(input.payload);
  if (input.payloadDigest !== payloadDigest) throw new Error('PAYLOAD_DIGEST_MISMATCH');
  return { ...input, payloadDigest };
}

export function makeReceipt(input) {
  const validated = validateProjection(input);
  const body = JSON.stringify({
    version: validated.version,
    generation: validated.generation,
    profile: validated.profile,
    idempotencyKey: validated.idempotencyKey,
    payloadDigest: validated.payloadDigest,
  });
  return Object.freeze({
    state: 'DONE',
    resultDigest: sha256(body),
    projectionDigest: validated.payloadDigest,
  });
}

export function renderPreview(input) {
  const validated = validateProjection(input);
  const escaped = validated.payload
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Preview</title></head><body><main><h1>Build and preview</h1><pre>${escaped}</pre></main></body></html>`;
}
