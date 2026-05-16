import type { StudentSummary } from '../data/teacherHub';

function progressBar(value: number, color: string): string {
  return `<div style="height:8px;border-radius:4px;background:#e2e8f0;margin-top:6px;overflow:hidden"><div style="height:100%;border-radius:4px;background:${color};width:${value}%"></div></div>`;
}

export function printStudentReport(student: StudentSummary): void {
  const now = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const hwColor = student.homeworkCompletion >= 70 ? '#10b981' : student.homeworkCompletion >= 40 ? '#f59e0b' : '#ef4444';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Progress Report — ${student.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;background:#fff;padding:48px;max-width:680px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:24px;margin-bottom:32px}
    .brand{font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#1b4a80}
    h1{font-size:28px;font-weight:700;margin-top:6px}
    .sub{font-size:13px;color:#64748b;margin-top:4px}
    .section{margin-bottom:28px}
    .section-title{font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#1b4a80;margin-bottom:14px}
    .stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .stat-card{background:#f8fafc;border-radius:12px;padding:16px}
    .stat-label{font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.14em}
    .stat-value{font-size:30px;font-weight:700;margin-top:6px;color:#0f172a}
    .stat-note{font-size:12px;color:#94a3b8;margin-top:6px}
    .class-row{background:#f8fafc;border-radius:10px;padding:12px 16px;font-size:13px;font-weight:600;margin-bottom:8px}
    .note-box{background:#f8fafc;border-radius:12px;padding:16px;font-size:13px;line-height:1.7;color:#334155;white-space:pre-wrap}
    .footer{margin-top:48px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
    @media print{body{padding:32px}@page{margin:20mm}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">SkillStream</div>
      <h1>${student.name}</h1>
      <div class="sub">${student.email}</div>
    </div>
    <div style="text-align:right">
      <div class="brand">Progress Report</div>
      <div class="sub" style="margin-top:6px">${now}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Performance overview</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Overall progress</div>
        <div class="stat-value">${student.progress}%</div>
        ${progressBar(student.progress, '#1b4a80')}
        <div class="stat-note">Across all enrolled classes</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Homework completion</div>
        <div class="stat-value">${student.homeworkCompletion}%</div>
        ${progressBar(student.homeworkCompletion, hwColor)}
        <div class="stat-note">Assignments submitted</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Classes enrolled (${student.classes.length})</div>
    ${student.classes.map((c) => `<div class="class-row">${c}</div>`).join('')}
  </div>

  ${student.note ? `
  <div class="section">
    <div class="section-title">Teacher notes</div>
    <div class="note-box">${student.note}</div>
  </div>` : ''}

  <div class="footer">
    <span>SkillStream — Private Teaching Platform</span>
    <span>Generated ${now}</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=760,height=900');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 300);
}
