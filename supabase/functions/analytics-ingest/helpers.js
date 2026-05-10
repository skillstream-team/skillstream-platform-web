export const normalizeEventType = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 64);
};
