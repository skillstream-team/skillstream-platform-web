export const startOfDayIso = (date = new Date()) => {
  const utcDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return utcDay.toISOString().slice(0, 10);
};
