import test from 'node:test';
import assert from 'node:assert/strict';
import {
  roomNameFromLessonId,
  normalizeMode,
  normalizeTicketPrice,
  normalizeNotes,
} from '../signalwire-token/helpers.js';

test('roomNameFromLessonId prefixes with skillstream-', () => {
  assert.ok(roomNameFromLessonId('abc').startsWith('skillstream-'));
});

test('roomNameFromLessonId strips hyphens from the lesson id', () => {
  assert.equal(roomNameFromLessonId('a1b2-c3d4'), 'skillstream-a1b2c3d4');
});

test('roomNameFromLessonId truncates suffix to 24 characters', () => {
  const longId = '11111111-22222222-33333333-44444444';
  const name = roomNameFromLessonId(longId);
  const suffix = name.replace('skillstream-', '');
  assert.ok(suffix.length <= 24, `suffix too long: ${suffix.length}`);
});

test('roomNameFromLessonId is deterministic for the same input', () => {
  const id = 'fa3d2c1b-e5f6-7890-abcd-ef1234567890';
  assert.equal(roomNameFromLessonId(id), roomNameFromLessonId(id));
});

test('normalizeMode returns paid only for the string "paid"', () => {
  assert.equal(normalizeMode('paid'), 'paid');
  assert.equal(normalizeMode('free'), 'free');
  assert.equal(normalizeMode('PAID'), 'free');
  assert.equal(normalizeMode(null), 'free');
  assert.equal(normalizeMode(undefined), 'free');
  assert.equal(normalizeMode(1), 'free');
});

test('normalizeTicketPrice returns 0 for free sessions', () => {
  assert.equal(normalizeTicketPrice('free', 999), 0);
  assert.equal(normalizeTicketPrice('free', 0), 0);
});

test('normalizeTicketPrice clamps to minimum 1 for paid sessions', () => {
  assert.equal(normalizeTicketPrice('paid', 15), 15);
  assert.equal(normalizeTicketPrice('paid', 0), 1);
  assert.equal(normalizeTicketPrice('paid', -5), 1);
  assert.equal(normalizeTicketPrice('paid', NaN), 1);
});

test('normalizeNotes trims whitespace and truncates at 5000 chars', () => {
  assert.equal(normalizeNotes('  hello  '), 'hello');
  assert.equal(normalizeNotes(''), '');
  const long = 'x'.repeat(6000);
  assert.equal(normalizeNotes(long).length, 5000);
});

test('normalizeNotes returns empty string for non-string input', () => {
  assert.equal(normalizeNotes(null), '');
  assert.equal(normalizeNotes(undefined), '');
  assert.equal(normalizeNotes(42), '');
});
