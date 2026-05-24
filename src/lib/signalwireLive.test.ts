import { describe, it, expect } from 'vitest';
import { roomNameFromLessonId } from './signalwireLive';

describe('roomNameFromLessonId', () => {
  it('prefixes with skillstream-', () => {
    expect(roomNameFromLessonId('abc')).toMatch(/^skillstream-/);
  });

  it('strips hyphens from the lesson id', () => {
    const name = roomNameFromLessonId('a1b2-c3d4-e5f6');
    const suffix = name.replace('skillstream-', '');
    expect(suffix).not.toContain('-');
    expect(name).toBe('skillstream-a1b2c3d4e5f6');
  });

  it('truncates to 24 characters after the prefix', () => {
    const longId = '11111111-22222222-33333333-44444444';
    const name = roomNameFromLessonId(longId);
    const suffix = name.replace('skillstream-', '');
    expect(suffix.length).toBeLessThanOrEqual(24);
  });

  it('produces a consistent result for the same input', () => {
    const id = 'fa3d2c1b-e5f6-7890-abcd-ef1234567890';
    expect(roomNameFromLessonId(id)).toBe(roomNameFromLessonId(id));
  });

  it('produces different names for different lesson ids', () => {
    expect(roomNameFromLessonId('lesson-a')).not.toBe(roomNameFromLessonId('lesson-b'));
  });
});
