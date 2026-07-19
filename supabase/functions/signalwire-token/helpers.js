export const roomNameFromLessonId = (lessonId) =>
  `skillstream-${lessonId.replace(/-/g, '').slice(0, 24)}`;

export const normalizeMode = (value) =>
  value === 'paid' ? 'paid' : 'free';

export const normalizeTicketPrice = (mode, value) =>
  mode === 'paid' ? Math.max(1, Number(value) || 1) : 0;

export const normalizeNotes = (value) =>
  typeof value === 'string' ? value.trim().slice(0, 5000) : '';
