const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUuid = (value) => typeof value === 'string' && UUID_RE.test(value);

/** Returns false if the webhook-timestamp is older than maxAgeSeconds (default 5 min). */
export const isTimestampFresh = (timestamp, maxAgeSeconds = 300) => {
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(Date.now() / 1000 - ts) <= maxAgeSeconds;
};
