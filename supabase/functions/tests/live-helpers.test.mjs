import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMode,
  normalizeNotes,
  normalizeTicketPrice,
  parseRoomName,
  roomNameFromLessonId,
} from '../daily-token/helpers.js';
import {
  normalizeSignature,
  normalizeUnixTimestampSeconds,
  signaturesFromHeader,
} from '../daily-webhook/helpers.js';

test('daily-token helpers parse and normalize values', () => {
  assert.equal(parseRoomName('https://example.daily.co/my-room'), 'my-room');
  assert.equal(parseRoomName('not-url'), '');
  assert.equal(normalizeMode('paid'), 'paid');
  assert.equal(normalizeMode('free'), 'free');
  assert.equal(normalizeTicketPrice('paid', 15), 15);
  assert.equal(normalizeTicketPrice('paid', 0), 1);
  assert.equal(normalizeTicketPrice('free', 999), 0);
  assert.equal(normalizeNotes('  hello  '), 'hello');
  assert.equal(roomNameFromLessonId('abc-def-123').startsWith('skillstream-'), true);
});

test('daily-webhook signature helpers normalize headers', () => {
  assert.equal(normalizeSignature('sha256=abc'), 'abc');
  assert.deepEqual(signaturesFromHeader('sha256=a,v1=b'), ['a', 'b']);
});

test('daily-webhook timestamp helper supports seconds and milliseconds', () => {
  assert.equal(normalizeUnixTimestampSeconds('1710000000'), 1710000000);
  assert.equal(normalizeUnixTimestampSeconds('1710000000000'), 1710000000);
  assert.equal(normalizeUnixTimestampSeconds('x'), null);
});
