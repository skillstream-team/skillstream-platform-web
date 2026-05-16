import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatHubDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function toDateTimeLocalMin(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins}m`
  }

  return `${hours}h ${mins}m`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (ch === '"') { inQuotes = false; i++; continue; }
      field += ch;
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(field.trim()); field = ''; i++; continue; }
      if (ch === '\r' && text[i + 1] === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; i += 2; continue; }
      if (ch === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; i++; continue; }
      field += ch;
    }
    i++;
  }
  row.push(field.trim());
  if (row.some((f) => f)) rows.push(row);
  return rows.filter((r) => r.some((f) => f));
}

export function buildCertificateHtml(r: { learnerName: string; courseTitle: string; orgName: string; issuedAt: string }): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .page{width:900px;height:640px;border:3px solid #1b4a80;border-radius:24px;padding:60px 80px;display:flex;flex-direction:column;justify-content:space-between}
    .top{display:flex;justify-content:space-between;align-items:flex-start}
    .brand{font-size:22px;font-weight:700;color:#1b4a80;letter-spacing:-0.5px}
    .badge{background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;padding:4px 14px;border-radius:20px;letter-spacing:.08em;text-transform:uppercase}
    .body{text-align:center}.label{font-size:13px;font-weight:600;color:#64748b;letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px}
    .name{font-size:42px;font-weight:700;color:#0f172a;letter-spacing:-1px;margin-bottom:24px}
    .completed{font-size:16px;color:#475569;margin-bottom:10px}.course{font-size:28px;font-weight:600;color:#1e3a8a;letter-spacing:-0.5px}
    .bottom{display:flex;justify-content:space-between;align-items:flex-end}
    .org{font-size:14px;color:#64748b}.org strong{display:block;font-size:16px;font-weight:600;color:#0f172a}
    .date{font-size:13px;color:#94a3b8;text-align:right}.line{width:80px;height:2px;background:#1b4a80;margin:0 auto 24px}
    @media print{body{display:block}}
  </style></head><body><div class="page">
    <div class="top"><span class="brand">SkillStream</span><span class="badge">Certificate of Completion</span></div>
    <div class="body"><p class="label">This certifies that</p><p class="name">${r.learnerName}</p><div class="line"></div><p class="completed">has successfully completed</p><p class="course">${r.courseTitle}</p></div>
    <div class="bottom"><div class="org"><span>Issued by</span><strong>${r.orgName}</strong></div><div class="date">Issued ${r.issuedAt}</div></div>
  </div></body></html>`;
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') {
    return 'SS'
  }

  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
