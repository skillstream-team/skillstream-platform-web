import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { loadEdgeHelperModule } = require('./loadEdgeHelpers.cjs');

const { isTimestampFresh, isValidUuid } = loadEdgeHelperModule('../dodo-webhook/helpers.js');

// ─── isTimestampFresh ────────────────────────────────────────────────────────

test('isTimestampFresh: rejects a timestamp 10 minutes in the past', () => {
  const old = Math.floor(Date.now() / 1000) - 600;
  assert.equal(isTimestampFresh(String(old)), false);
});

test('isTimestampFresh: accepts a timestamp from 1 second ago', () => {
  const recent = Math.floor(Date.now() / 1000) - 1;
  assert.equal(isTimestampFresh(String(recent)), true);
});

test('isTimestampFresh: accepts a timestamp well within the boundary (60s ago)', () => {
  const recent = Math.floor(Date.now() / 1000) - 60;
  assert.equal(isTimestampFresh(String(recent)), true);
});

test('isTimestampFresh: rejects a timestamp 301 seconds in the past', () => {
  const tooOld = Math.floor(Date.now() / 1000) - 301;
  assert.equal(isTimestampFresh(String(tooOld)), false);
});

test('isTimestampFresh: rejects a non-numeric string', () => {
  assert.equal(isTimestampFresh('not-a-number'), false);
  assert.equal(isTimestampFresh(''), false);
});

test('isTimestampFresh: respects a custom maxAgeSeconds', () => {
  const ts = Math.floor(Date.now() / 1000) - 10;
  assert.equal(isTimestampFresh(String(ts), 5), false);
  assert.equal(isTimestampFresh(String(ts), 60), true);
});

// ─── isValidUuid ─────────────────────────────────────────────────────────────

test('isValidUuid: accepts a valid v4 UUID', () => {
  assert.equal(isValidUuid('123e4567-e89b-12d3-a456-426614174000'), true);
});

test('isValidUuid: rejects a UUID without hyphens', () => {
  assert.equal(isValidUuid('123e4567e89b12d3a456426614174000'), false);
});

test('isValidUuid: rejects an empty string', () => {
  assert.equal(isValidUuid(''), false);
});

test('isValidUuid: rejects a non-string value', () => {
  assert.equal(isValidUuid(null), false);
  assert.equal(isValidUuid(undefined), false);
  assert.equal(isValidUuid(42), false);
});

test('isValidUuid: rejects a string that is almost a UUID', () => {
  assert.equal(isValidUuid('123e4567-e89b-12d3-a456-42661417400'), false);  // too short
  assert.equal(isValidUuid('123e4567-e89b-12d3-a456-4266141740000'), false); // too long
});
