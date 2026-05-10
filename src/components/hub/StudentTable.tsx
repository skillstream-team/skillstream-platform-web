import React from 'react';
import { Link } from 'react-router-dom';
import { StudentSummary } from '../../data/teacherHub';

const formatDateTime = (dateString: string) =>
  new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));

export const StudentTable: React.FC<{ students: StudentSummary[]; allowProfileLinks?: boolean }> = ({ students, allowProfileLinks = true }) => {
  return (
    <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="grid gap-3 p-4 md:hidden">
        {students.map((student) => (
          <div key={student.id} className="rounded-[20px] border border-[color:var(--hub-border)] bg-white p-4">
            {allowProfileLinks ? (
              <Link to={`/students/${student.id}`} className="text-sm font-semibold text-[color:var(--hub-text)] hover:text-[color:var(--hub-primary)]">
                {student.name}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-[color:var(--hub-text)]">{student.name}</p>
            )}
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{student.email}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[color:var(--hub-muted)]">
              <div className="rounded-xl bg-[color:var(--hub-soft)] px-3 py-2">
                <p className="font-semibold text-[color:var(--hub-text)]">{student.progress}%</p>
                <p>Progress</p>
              </div>
              <div className="rounded-xl bg-[color:var(--hub-soft)] px-3 py-2">
                <p className="font-semibold text-[color:var(--hub-text)]">{student.homeworkCompletion}%</p>
                <p>Homework</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[color:var(--hub-muted)]">Last active {formatDateTime(student.lastActivity)}</p>
            <p className="mt-1 text-xs text-[color:var(--hub-muted)]">{student.classes.join(', ')}</p>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left">
          <thead className="bg-[color:var(--hub-soft)]">
            <tr className="text-xs uppercase tracking-[0.18em] text-[color:var(--hub-muted)]">
              <th className="px-5 py-4 font-semibold">Student</th>
              <th className="px-5 py-4 font-semibold">Progress</th>
              <th className="px-5 py-4 font-semibold">Homework</th>
              <th className="px-5 py-4 font-semibold">Last activity</th>
              <th className="px-5 py-4 font-semibold">Classes</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-t border-[color:var(--hub-border)] align-top">
                <td className="px-5 py-4">
                  {allowProfileLinks ? (
                    <Link to={`/students/${student.id}`} className="font-semibold text-[color:var(--hub-text)] hover:text-[color:var(--hub-primary)]">
                      {student.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[color:var(--hub-text)]">{student.name}</span>
                  )}
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{student.email}</p>
                </td>
                <td className="px-5 py-4 text-sm text-[color:var(--hub-text)]">{student.progress}%</td>
                <td className="px-5 py-4 text-sm text-[color:var(--hub-text)]">{student.homeworkCompletion}% complete</td>
                <td className="px-5 py-4 text-sm text-[color:var(--hub-muted)]">{formatDateTime(student.lastActivity)}</td>
                <td className="px-5 py-4 text-sm text-[color:var(--hub-muted)]">{student.classes.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
