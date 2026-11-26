import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createSessionToken, verifySessionToken } from './auth.mjs';

test('session JWTs verify only with their signed user and session claims', async () => {
  const sessionId = randomUUID();
  const token = await createSessionToken(42, sessionId);
  const tokenParts = token.split('.');
  tokenParts[2] = `${tokenParts[2][0] === 'a' ? 'b' : 'a'}${tokenParts[2].slice(1)}`;

  assert.deepEqual(await verifySessionToken(token), { userId: '42', sessionId });
  assert.equal(await verifySessionToken(tokenParts.join('.')), null);
});
