const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEdgeHelperModule } = require('./loadEdgeHelpers.cjs');

const {
  normalizeSignature,
  signaturesFromHeader,
  normalizeUnixTimestampSeconds,
  toBytes,
  toHex,
  toBase64,
} = loadEdgeHelperModule('../daily-webhook/helpers.js');

test('signature normalization strips known prefixes', () => {
  assert.equal(normalizeSignature('sha256=abc123'), 'abc123');
  assert.equal(normalizeSignature('v1=def456'), 'def456');
  assert.equal(normalizeSignature(' raw '), 'raw');
});

test('signature header parsing returns normalized values', () => {
  assert.deepEqual(Array.from(signaturesFromHeader('sha256=abc, v1=def, ghi')), ['abc', 'def', 'ghi']);
});

test('timestamp normalization handles seconds and milliseconds', () => {
  assert.equal(normalizeUnixTimestampSeconds('1714300000'), 1714300000);
  assert.equal(normalizeUnixTimestampSeconds('1714300000123'), 1714300000);
  assert.equal(normalizeUnixTimestampSeconds('not-a-number'), null);
});

test('byte conversion helpers are stable', () => {
  const bytes = toBytes('hello');
  assert.equal(toHex(bytes), '68656c6c6f');
  assert.equal(toBase64(bytes), 'aGVsbG8=');
});
