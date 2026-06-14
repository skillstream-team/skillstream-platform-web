import React, { useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import { ClassCard } from '../components/hub/ClassCard';
import { ActionModal } from '../components/common/ActionModal';
import { useNotifications } from '../components/notifications/NotificationToast';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';

export const ClassesPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const allClasses = useTeacherHubStore((state) => state.classes);
  const students = useTeacherHubStore((state) => state.students);
  const currentStudent = students.find((entry) => entry.email.toLowerCase() === (user?.email || '').toLowerCase());
  const classes = isStudent
    ? currentStudent
      ? allClasses.filter((entry) => entry.students.some((student) => student.id === currentStudent.id))
      : []
    : allClasses;
  const createClass = useTeacherHubStore((state) => state.createClass);
  const { addNotification } = useNotifications();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedInviteClassId, setSelectedInviteClassId] = useState('');
  const [name, setName] = useState('');
  const [overview, setOverview] = useState('');
  const [nameError, setNameError] = useState('');
  const [overviewError, setOverviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const selectedInviteClass = classes.find((entry) => entry.id === selectedInviteClassId) || null;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Classes</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">
              {user?.role === 'STUDENT' ? 'Your active classes.' : 'Manage classes from one workspace.'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--hub-muted)]">
              {isStudent
                ? 'Open class spaces, lesson timelines, and updates.'
                : 'Create classes, schedule sessions, and share invites.'}
            </p>
          </div>
          {!isStudent ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" />
                Create class
              </button>
              <button type="button" onClick={() => setShowInviteModal(true)} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)]">
                <Link2 className="h-4 w-4" />
                Generate invite
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {classes.length > 0 ? (
          classes.map((teacherClass) => (
            <ClassCard key={teacherClass.id} teacherClass={teacherClass} />
          ))
        ) : (
          <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 text-sm text-[color:var(--hub-muted)] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            {user?.role === 'STUDENT'
              ? 'You have no current classes.'
              : 'No classes yet. Create one to get started.'}
          </div>
        )}
      </section>

      <ActionModal
        isOpen={showCreateModal}
        title="Create a new class"
        description="Set up a fresh class workspace with its own invite code and lesson timeline."
        onClose={() => setShowCreateModal(false)}
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmedName = name.trim();
            const trimmedOverview = overview.trim();
            const nextNameError = trimmedName ? '' : 'Class name is required.';
            const nextOverviewError = trimmedOverview ? '' : 'Class description is required.';
            setNameError(nextNameError);
            setOverviewError(nextOverviewError);
            if (nextNameError || nextOverviewError) return;

            try {
              setSubmitting(true);
              await createClass({ name: trimmedName, overview: trimmedOverview });
              setName('');
              setOverview('');
              setNameError('');
              setOverviewError('');
              setShowCreateModal(false);
              addNotification({
                type: 'success',
                title: 'Class created',
                message: 'Your new class is ready.',
                duration: 2200,
              });
            } catch (error) {
              addNotification({
                type: 'error',
                title: 'Could not create class',
                message: error instanceof Error ? error.message : 'Please try again.',
                duration: 2800,
              });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <label className="grid gap-2 text-sm font-medium text-[color:var(--hub-text)]">
            <span>
              Class name <span className="text-[color:var(--edu-danger)]">*</span>
            </span>
            <input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError && event.target.value.trim()) setNameError('');
              }}
              className={cn('rounded-2xl border px-4 py-3 outline-none', nameError ? 'border-[color:var(--edu-danger)] bg-[rgba(200,95,73,0.06)]' : 'border-[color:var(--hub-border)]')}
            />
            {nameError ? <span className="text-xs text-[color:var(--edu-danger)]">{nameError}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-medium text-[color:var(--hub-text)]">
            <span>
              Class description <span className="text-[color:var(--edu-danger)]">*</span>
            </span>
            <textarea
              value={overview}
              onChange={(event) => {
                setOverview(event.target.value);
                if (overviewError && event.target.value.trim()) setOverviewError('');
              }}
              rows={4}
              className={cn('rounded-2xl border px-4 py-3 outline-none', overviewError ? 'border-[color:var(--edu-danger)] bg-[rgba(200,95,73,0.06)]' : 'border-[color:var(--hub-border)]')}
            />
            {overviewError ? <span className="text-xs text-[color:var(--edu-danger)]">{overviewError}</span> : null}
          </label>
          <button type="submit" disabled={submitting} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? 'Creating class...' : 'Create class'}
          </button>
        </form>
      </ActionModal>

      <ActionModal
        isOpen={showInviteModal}
        title="Generate class invite"
        description="Select a class and copy the active invite link."
        onClose={() => setShowInviteModal(false)}
      >
        <div className="grid gap-4">
          <select
            value={selectedInviteClassId}
            onChange={(event) => setSelectedInviteClassId(event.target.value)}
            className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none"
          >
            <option value="">Select class</option>
            {classes.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </select>
          {selectedInviteClass ? (
            <div className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] p-3 text-sm text-[color:var(--hub-text)]">
              <p className="font-semibold">{selectedInviteClass.name}</p>
              <p className="mt-1 text-[color:var(--hub-muted)]">{selectedInviteClass.inviteLink}</p>
            </div>
          ) : null}
          <button
            type="button"
            disabled={!selectedInviteClass}
            onClick={() => {
              if (!selectedInviteClass) return;
              navigator.clipboard?.writeText(selectedInviteClass.inviteLink).then(() => {
                addNotification({
                  type: 'success',
                  title: 'Invite copied',
                  message: 'Share this link with your learner.',
                  duration: 2200,
                });
              }).catch(() => {
                addNotification({
                  type: 'warning',
                  title: 'Copy failed',
                  message: 'Clipboard access is blocked in this browser tab.',
                  duration: 2600,
                });
              });
            }}
            className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Copy invite link
          </button>
        </div>
      </ActionModal>
    </div>
  );
};
