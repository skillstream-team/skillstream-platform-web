export const compact = (text, max = 120) => (text.length <= max ? text : `${text.slice(0, max - 1)}…`);
