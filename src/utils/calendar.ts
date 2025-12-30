/**
 * Generate an ICS (iCalendar) file content from lessons
 */

export interface CalendarLesson {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  joinLink?: string
}

/**
 * Format date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Escape text for ICS format (replace commas, semicolons, and newlines)
 */
function escapeICSString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/**
 * Generate ICS file content from lessons
 */
export function generateICS(lessons: CalendarLesson[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillStream//Lessons Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  lessons.forEach((lesson) => {
    const startDate = new Date(lesson.scheduledAt)
    const endDate = new Date(startDate.getTime() + lesson.duration * 60 * 1000)
    
    const uid = `lesson-${lesson.id}@skillstream`
    const summary = escapeICSString(lesson.title)
    const description = lesson.description
      ? escapeICSString(lesson.description)
      : `Lesson: ${summary}`
    const location = lesson.joinLink ? escapeICSString(lesson.joinLink) : ''
    
    const eventLines = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      ...(location ? [`LOCATION:${location}`] : []),
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
    ]

    lines.push(...eventLines)
  })

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Download ICS file
 */
export function downloadICS(lessons: CalendarLesson[], filename: string = 'skillstream-lessons.ics') {
  const icsContent = generateICS(lessons)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

