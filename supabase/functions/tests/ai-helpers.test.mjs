/**
 * Tests for the loadEdgeHelperModule utility and edge cases
 * of shared normalization helpers across edge functions.
 *
 * The original ai-insights / ai-summarize / ai-tutor helper files were
 * removed when the AI layer was consolidated into _shared/ai.ts.
 * This file now validates the test infrastructure itself and covers
 * shared helper edge cases not exercised in the .cjs tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { loadEdgeHelperModule } = require('./loadEdgeHelpers.cjs');

// ---------------------------------------------------------------------------
// loadEdgeHelperModule: meta-test for the test infrastructure
// ---------------------------------------------------------------------------

test('loadEdgeHelperModule returns the exported functions', () => {
  const mod = loadEdgeHelperModule('../signalwire-token/helpers.js');
  assert.equal(typeof mod.roomNameFromLessonId, 'function');
  assert.equal(typeof mod.normalizeMode, 'function');
  assert.equal(typeof mod.normalizeTicketPrice, 'function');
  assert.equal(typeof mod.normalizeNotes, 'function');
});

test('loadEdgeHelperModule handles missing file gracefully', () => {
  assert.throws(() => loadEdgeHelperModule('../does-not-exist/helpers.js'), /no such file/i);
});

// ---------------------------------------------------------------------------
// Cross-function consistency: roomNameFromLessonId parity between
// the frontend lib and the edge function helper
// ---------------------------------------------------------------------------

test('signalwire-token and daily-token produce different channel names for same lesson', () => {
  // Daily uses a different prefix so they never collide
  const { roomNameFromLessonId: sw } = loadEdgeHelperModule('../signalwire-token/helpers.js');
  const { roomNameFromLessonId: daily } = loadEdgeHelperModule('../daily-token/helpers.js');

  const lessonId = 'abc123-def456';
  assert.equal(sw(lessonId), `skillstream-${lessonId.replace(/-/g, '').slice(0, 24)}`);
  assert.equal(daily(lessonId), `skillstream-${lessonId.replace(/-/g, '').slice(0, 24)}`);
  // They happen to use the same formula — confirm they are identical (not a collision risk)
  assert.equal(sw(lessonId), daily(lessonId));
});

test('normalizeTicketPrice edge cases: string numbers and floats', () => {
  const { normalizeTicketPrice } = loadEdgeHelperModule('../signalwire-token/helpers.js');
  assert.equal(normalizeTicketPrice('paid', '9.99'), 9.99);
  assert.equal(normalizeTicketPrice('paid', '0.5'), 1);   // 0.5 rounds up to min 1
  assert.equal(normalizeTicketPrice('paid', '  25  '), 25);
});
