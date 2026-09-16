import { mkdir, writeFile } from 'node:fs/promises';
import { sha256, makeReceipt, renderPreview } from '../src/projection.mjs';

const payload = 'preview-ok';
const projection = {
  version: 'PREVIEW_PROJECTION_V1',
  generation: 1,
  profile: 'WEB_PREVIEW',
  idempotencyKey: 'a'.repeat(64),
  payload,
  payloadDigest: sha256(payload),
};

const receipt = makeReceipt(projection);
const html = renderPreview(projection);
await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', html, 'utf8');
await writeFile('dist/receipt.json', `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, resultDigest: receipt.resultDigest }));
