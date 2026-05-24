export const roomNameFromLessonId = (lessonId: string): string =>
  `skillstream-${lessonId.replace(/-/g, '').slice(0, 24)}`;

export const normalizeMode = (value: unknown): 'free' | 'paid' =>
  value === 'paid' ? 'paid' : 'free';

export const normalizeTicketPrice = (mode: string, value: unknown): number =>
  mode === 'paid' ? Math.max(1, Number(value) || 1) : 0;

export const normalizeNotes = (value: unknown): string =>
  typeof value === 'string' ? value.trim().slice(0, 5000) : '';
