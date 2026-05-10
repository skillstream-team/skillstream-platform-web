import test from 'node:test';
import assert from 'node:assert/strict';
import { asText, toNumber } from '../ai-insights/helpers.js';
import { compact } from '../ai-summarize/helpers.js';
import { asLower, inferIntent } from '../ai-tutor/helpers.js';

test('ai-insights helpers normalize text and number', () => {
  assert.equal(asText('  hello  '), 'hello');
  assert.equal(asText(null), '');
  assert.equal(toNumber('42'), 42);
  assert.equal(toNumber('abc'), 0);
});

test('ai-summarize compact keeps short text and trims long text', () => {
  assert.equal(compact('short', 20), 'short');
  const result = compact('abcdefghijklmnopqrstuvwxyz', 10);
  assert.equal(result.length, 10);
  assert.ok(result.endsWith('…'));
});

test('ai-tutor helpers infer intent categories', () => {
  assert.equal(asLower('Teacher'), 'teacher');
  assert.equal(inferIntent('When is my next lesson?'), 'schedule');
  assert.equal(inferIntent('How do I submit homework?'), 'homework');
  assert.equal(inferIntent('How do I improve progress?'), 'progress');
  assert.equal(inferIntent('Hello there'), 'general');
});
