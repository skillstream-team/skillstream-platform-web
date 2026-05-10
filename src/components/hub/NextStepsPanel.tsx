import React from 'react';
import { ArrowRight, BellRing, CalendarClock, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TeacherTask } from '../../data/teacherHub';

const iconByType = {
  urgent: ClipboardCheck,
  soon: CalendarClock,
  done: BellRing,
};

const statusLabel = {
  urgent: 'Urgent',
  soon: 'Coming up',
  done: 'Done',
};

const formatDue = (dateString: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));

export const NextStepsPanel: React.FC<{ tasks: TeacherTask[] }> = ({ tasks }) => {
  return (
    <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Pending Tasks</p>
          <h2 className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">Fast admin wins for today</h2>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--hub-muted)]">Clear reviews, replies, and follow-ups in one place.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {tasks.length > 0 ? tasks.map((task) => {
          const Icon = iconByType[task.status];
          return (
            <div
              key={task.id}
              className="flex flex-col gap-4 rounded-[24px] border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[color:var(--hub-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[color:var(--hub-text)]">{task.title}</h3>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[color:var(--hub-muted)]">
                      {statusLabel[task.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{task.detail}</p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">
                    Due {formatDue(task.dueAt)}
                  </p>
                </div>
              </div>

              <Link to={task.actionPath} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                {task.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        }) : (
          <div className="rounded-[24px] border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
            You are all caught up. No pending tasks right now.
          </div>
        )}
      </div>
    </section>
  );
};
