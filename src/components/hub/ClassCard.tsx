import React from 'react';
import { ArrowRight, Calendar, Link2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TeacherClass } from '../../data/teacherHub';

const formatSessionTime = (dateString: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));

export const ClassCard: React.FC<{ teacherClass: TeacherClass }> = ({ teacherClass }) => {
  return (
    <Link
      to={`/class/${teacherClass.id}`}
      className="group rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]"
    >
      <div className={`rounded-[22px] bg-gradient-to-br ${teacherClass.accent} p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--hub-muted)]">Class</p>
            <h3 className="mt-2 text-xl font-semibold text-[color:var(--hub-text)]">{teacherClass.name}</h3>
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{teacherClass.overview}</p>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)]">
            {teacherClass.studentCount} students
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-[color:var(--hub-muted)]">
          <Calendar className="h-4 w-4 text-[color:var(--hub-primary)]" />
          <span>Next session {formatSessionTime(teacherClass.nextSessionAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[color:var(--hub-muted)]">
          <Users className="h-4 w-4 text-[color:var(--hub-primary)]" />
          <span>{teacherClass.studentCount} active learners</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[color:var(--hub-muted)]">
          <Link2 className="h-4 w-4 text-[color:var(--hub-success)]" />
          <span>Invite code {teacherClass.inviteCode}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm font-semibold text-[color:var(--hub-primary)]">
        <span>Open class workspace</span>
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
};
