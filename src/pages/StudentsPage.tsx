import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { StudentTable } from '../components/hub/StudentTable';
import { useSessionUiStore } from '../store/sessionUi';
import { useTeacherHubStore } from '../store/teacherHub';

export const StudentsPage: React.FC = () => {
  const query = useSessionUiStore((state) => state.studentsSearchQuery);
  const setQuery = useSessionUiStore((state) => state.setStudentsSearchQuery);
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const userEmail = (user?.email || '').toLowerCase();
  const allStudents = useTeacherHubStore((state) => state.students);
  const allClasses = useTeacherHubStore((state) => state.classes);
  const students = useMemo(
    () => (isStudent
      ? allStudents.filter((entry) => entry.email.toLowerCase() === userEmail).slice(0, 1)
      : allStudents),
    [allStudents, isStudent, userEmail]
  );
  const classmates = useMemo(
    () => (isStudent
      ? allClasses
          .filter((entry) => entry.students.some((student) => student.email.toLowerCase() === userEmail))
          .flatMap((entry) => entry.students)
          .filter((entry, index, list) => list.findIndex((candidate) => candidate.id === entry.id) === index)
      : []),
    [allClasses, isStudent, userEmail]
  );

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || isStudent) return students;

    return students.filter((student) => {
      const blob = `${student.name} ${student.email} ${student.classes.join(' ')}`.toLowerCase();
      return blob.includes(normalized);
    });
  }, [isStudent, query, students]);

  const filteredClassmates = useMemo(() => {
    if (!isStudent) return classmates;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return classmates;
    return classmates.filter((student) => {
      const blob = `${student.name} ${student.email} ${student.classes.join(' ')}`.toLowerCase();
      return blob.includes(normalized);
    });
  }, [classmates, isStudent, query]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Students</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">
          {isStudent ? 'Your learner profile and classmates.' : 'See every student across every class.'}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[color:var(--hub-muted)]">
          {isStudent
            ? 'Track your progress and class participation.'
            : 'Search progress, homework completion, and last activity.'}
        </p>
        <div className="relative mt-5 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--hub-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isStudent ? 'Search classmates' : 'Search students or classes'}
            className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-11 py-3 text-sm outline-none"
          />
        </div>
      </section>

      {filteredStudents.length > 0 ? (
        <StudentTable students={filteredStudents} allowProfileLinks={!isStudent} />
      ) : (
        <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 text-sm text-[color:var(--hub-muted)] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          {isStudent ? 'No learner profile found.' : 'No students found.'}
        </div>
      )}

      {isStudent ? (
        <section className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold text-[color:var(--hub-text)]">Classmates</p>
          <div className="mt-4 grid gap-3">
            {filteredClassmates.length > 0 ? (
              filteredClassmates.map((entry) => (
                <div key={entry.id} className="rounded-[20px] bg-[color:var(--hub-soft)] px-4 py-3 text-sm text-[color:var(--hub-text)]">
                  {entry.name}
                </div>
              ))
            ) : (
              <div className="rounded-[20px] bg-[color:var(--hub-soft)] px-4 py-3 text-sm text-[color:var(--hub-muted)]">
                {query.trim() ? 'No matching classmates.' : 'No classmates yet.'}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
};
