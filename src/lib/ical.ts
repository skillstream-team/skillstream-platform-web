import type { LessonSummary } from '../data/teacherHub';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIcalDate(iso: string): string {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
}

export function buildIcal(lessons: LessonSummary[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillStream//SkillStream//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:SkillStream Lessons',
  ];

  for (const lesson of lessons) {
    if (lesson.status === 'cancelled') continue;
    const start = lesson.scheduledAt;
    const end = new Date(new Date(start).getTime() + lesson.durationMinutes * 60 * 1000).toISOString();
    lines.push(
      'BEGIN:VEVENT',
      `UID:${lesson.id}@skillstream.world`,
      `DTSTART:${toIcalDate(start)}`,
      `DTEND:${toIcalDate(end)}`,
      `SUMMARY:${escapeIcal(lesson.title)}`,
      `DESCRIPTION:${escapeIcal(lesson.className)} \\u2022 ${lesson.durationMinutes} mins`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcal(filename: string, lessons: LessonSummary[]): void {
  const content = buildIcal(lessons);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
