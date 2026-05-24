import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatDate,
  formatDateTime,
  formatHubDateTime,
  formatDuration,
  toDateTimeLocalMin,
  getInitials,
  isValidEmail,
  parseCsv,
  truncateText,
  generateId,
  debounce,
  buildCertificateHtml,
} from './utils';

// ---------------------------------------------------------------------------
// cn (clsx + tailwind-merge)
// ---------------------------------------------------------------------------
describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('deduplicates conflicting tailwind classes', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('handles conditional falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('formats an ISO string to long en-GB date', () => {
    const result = formatDate('2026-03-15T00:00:00.000Z');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/March/);
    expect(result).toMatch(/2026/);
  });

  it('accepts a Date object', () => {
    const d = new Date('2026-01-01T12:00:00.000Z');
    const result = formatDate(d);
    expect(result).toMatch(/2026/);
  });
});

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------
describe('formatDateTime', () => {
  it('includes hour and minute', () => {
    const result = formatDateTime('2026-06-10T14:30:00.000Z');
    expect(result).toMatch(/2026/);
    // hour:minute pattern present (exact value is locale/timezone dependent)
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------
describe('formatDuration', () => {
  it('shows only minutes when under 60', () => {
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(0)).toBe('0m');
  });

  it('shows hours and minutes for values >= 60', () => {
    expect(formatDuration(60)).toBe('1h 0m');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(125)).toBe('2h 5m');
  });

  it('handles exact hour multiples', () => {
    expect(formatDuration(120)).toBe('2h 0m');
  });
});

// ---------------------------------------------------------------------------
// truncateText
// ---------------------------------------------------------------------------
describe('truncateText', () => {
  it('returns text unchanged when within limit', () => {
    expect(truncateText('hello', 10)).toBe('hello');
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('truncates and appends ellipsis when over limit', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
    expect(truncateText('abcdef', 3)).toBe('abc...');
  });

  it('handles empty string', () => {
    expect(truncateText('', 5)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------
describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------
describe('isValidEmail', () => {
  it('accepts valid email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('teacher@skillstream.demo')).toBe(true);
    expect(isValidEmail('a+b@sub.domain.io')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseCsv
// ---------------------------------------------------------------------------
describe('parseCsv', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCsv('a,b,c')).toEqual([['a', 'b', 'c']]);
  });

  it('parses multiple rows separated by newlines', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\nc,d')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCsv('"hello, world",b')).toEqual([['hello, world', 'b']]);
  });

  it('handles escaped double quotes inside quoted fields', () => {
    expect(parseCsv('"say ""hi""",b')).toEqual([['say "hi"', 'b']]);
  });

  it('trims whitespace from unquoted fields', () => {
    expect(parseCsv('  a  ,  b  ')).toEqual([['a', 'b']]);
  });

  it('skips fully empty rows', () => {
    expect(parseCsv('a,b\n\nc,d')).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('returns empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('\n\n')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildCertificateHtml
// ---------------------------------------------------------------------------
describe('buildCertificateHtml', () => {
  it('embeds learner name, course title, org name, and issued date', () => {
    const html = buildCertificateHtml({
      learnerName: 'Jane Doe',
      courseTitle: 'Advanced Maths',
      orgName: 'Acme Academy',
      issuedAt: '1 January 2026',
    });
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Advanced Maths');
    expect(html).toContain('Acme Academy');
    expect(html).toContain('1 January 2026');
  });

  it('produces valid HTML with a doctype', () => {
    const html = buildCertificateHtml({ learnerName: 'A', courseTitle: 'B', orgName: 'C', issuedAt: 'D' });
    expect(html.trimStart()).toMatch(/^<!DOCTYPE html>/i);
  });
});

// ---------------------------------------------------------------------------
// formatHubDateTime
// ---------------------------------------------------------------------------
describe('formatHubDateTime', () => {
  it('includes weekday, month, day, and time', () => {
    const result = formatHubDateTime('2026-03-09T14:30:00.000Z');
    // Result is locale-dependent but must include day-of-month
    expect(result).toMatch(/9/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('accepts a Date object', () => {
    const d = new Date('2026-06-15T09:00:00.000Z');
    const result = formatHubDateTime(d);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// toDateTimeLocalMin
// ---------------------------------------------------------------------------
describe('toDateTimeLocalMin', () => {
  it('returns a string in datetime-local format (YYYY-MM-DDTHH:MM)', () => {
    const result = toDateTimeLocalMin();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('does not include seconds or timezone offset', () => {
    const result = toDateTimeLocalMin();
    expect(result).not.toContain('Z');
    expect(result).not.toContain('+');
    expect(result.length).toBe(16); // "YYYY-MM-DDTHH:MM"
  });
});

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------
describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not call the function immediately', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls the function after the wait period', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('resets the timer on each call and only fires once', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    vi.advanceTimersByTime(50);
    debounced('b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('b');
  });
});

// ---------------------------------------------------------------------------
// getInitials
// ---------------------------------------------------------------------------
describe('getInitials', () => {
  it('returns first letter of a single word', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns first letter of each word, capped at 2', () => {
    expect(getInitials('Alice Smith')).toBe('AS');
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('returns SS for null, undefined, or empty string', () => {
    expect(getInitials(null)).toBe('SS');
    expect(getInitials(undefined)).toBe('SS');
    expect(getInitials('')).toBe('SS');
  });

  it('uppercases the result', () => {
    expect(getInitials('alice smith')).toBe('AS');
  });
});
