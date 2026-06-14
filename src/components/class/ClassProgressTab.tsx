import React from 'react';
import { ProgressStrip } from '../hub/ProgressStrip';
import { TeacherClass } from '../../data/teacherHub';

interface Props {
  teacherClass: TeacherClass;
}

export const ClassProgressTab: React.FC<Props> = ({ teacherClass }) => (
  <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
    <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Class performance</p>
      <div className="mt-5">
        <ProgressStrip items={teacherClass.topics} />
      </div>
    </div>
    <div className="space-y-6">
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Students needing attention</p>
        <div className="mt-4 grid gap-3">
          {teacherClass.students.filter((s) => s.needsAttention).length > 0 ? (
            teacherClass.students.filter((s) => s.needsAttention).map((student) => (
              <div key={student.id} className="rounded-[22px] bg-[color:var(--hub-soft)] p-4">
                <p className="text-sm font-semibold text-[color:var(--hub-text)]">{student.name}</p>
                <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{student.note}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">No learners currently need attention.</div>
          )}
        </div>
      </div>
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Quick intervention idea</p>
        <div className="mt-4 rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">
          Run a 10-minute diagnostic at the start of the next lesson, then split follow-up questions by weak topic.
        </div>
      </div>
    </div>
  </section>
);
