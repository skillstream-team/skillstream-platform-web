export const asLower = (value) => (typeof value === 'string' ? value.toLowerCase() : '');

export const inferIntent = (question) => {
  const lower = question.toLowerCase();
  if (lower.includes('homework') || lower.includes('assignment') || lower.includes('submit')) return 'homework';
  if (lower.includes('schedule') || lower.includes('lesson') || lower.includes('class time')) return 'schedule';
  if (lower.includes('progress') || lower.includes('improve') || lower.includes('stuck')) return 'progress';
  return 'general';
};
