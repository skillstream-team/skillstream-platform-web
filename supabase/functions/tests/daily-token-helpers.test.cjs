const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEdgeHelperModule } = require('./loadEdgeHelpers.cjs');

const {
  parseRoomName,
  normalizeMode,
  normalizeTicketPrice,
  normalizeNotes,
  roomNameFromLessonId,
} = loadEdgeHelperModule('../daily-token/helpers.js');

test('parseRoomName extracts room slug from Daily URL', () => {
  assert.equal(parseRoomName('https://acme.daily.co/lesson-room'), 'lesson-room');
  assert.equal(parseRoomName('not-a-url'), '');
});

test('normalize mode and ticket price enforce defaults', () => {
  assert.equal(normalizeMode('paid'), 'paid');
  assert.equal(normalizeMode('unexpected'), 'free');
  assert.equal(normalizeTicketPrice('free', 10), 0);
  assert.equal(normalizeTicketPrice('paid', 0), 1);
  assert.equal(normalizeTicketPrice('paid', 14), 14);
});

test('normalizeNotes trims and caps text', () => {
  const value = `  ${'x'.repeat(6000)}  `;
  const normalized = normalizeNotes(value);
  assert.equal(normalized.length, 5000);
});

test('roomNameFromLessonId is deterministic', () => {
  const room = roomNameFromLessonId('123e4567-e89b-12d3-a456-426614174000');
  assert.equal(room.startsWith('skillstream-'), true);
});
