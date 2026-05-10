import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEventType } from '../analytics-ingest/helpers.js';
import { isValidEmail } from '../class-invite-email/helpers.js';
import { startOfDayIso } from '../ops-cron/helpers.js';

test('analytics helper normalizes event type', () => {
  assert.equal(normalizeEventType('  class_created  '), 'class_created');
  assert.equal(normalizeEventType(123), '');
  assert.equal(normalizeEventType('x'.repeat(70)).length, 64);
});

test('class invite helper validates email format', () => {
  assert.equal(isValidEmail('user@example.com'), true);
  assert.equal(isValidEmail('invalid-email'), false);
});

test('ops cron helper computes UTC day key', () => {
  const value = startOfDayIso(new Date('2026-04-19T23:59:59.000Z'));
  assert.equal(value, '2026-04-19');
});
