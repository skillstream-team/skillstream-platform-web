const encoder = new TextEncoder();

const safeAtob = (value) => {
  try {
    return atob(value);
  } catch {
    return null;
  }
};

export const toBytes = (value) => {
  const decoded = safeAtob(value);
  if (decoded === null) {
    return encoder.encode(value);
  }
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
};

export const toHex = (value) => Array.from(value).map((byte) => byte.toString(16).padStart(2, '0')).join('');
export const toBase64 = (value) => btoa(String.fromCharCode(...value));

export const normalizeSignature = (value) =>
  value
    .trim()
    .replace(/^sha256=/i, '')
    .replace(/^v1=/i, '');

export const signaturesFromHeader = (headerValue) =>
  headerValue
    .split(',')
    .map((entry) => normalizeSignature(entry))
    .filter(Boolean);

export const normalizeUnixTimestampSeconds = (raw) => {
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return null;
  return ts > 10_000_000_000 ? Math.floor(ts / 1000) : Math.floor(ts);
};
