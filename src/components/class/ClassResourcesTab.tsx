import React, { useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import { ActionModal } from '../common/ActionModal';
import { useNotifications } from '../notifications/NotificationToast';
import { formatHubDateTime } from '../../lib/utils';
import { TeacherClass } from '../../data/teacherHub';

interface Props {
  teacherClass: TeacherClass;
  isStudent: boolean;
  uploadClassResource: (args: {
    classId: string;
    title: string;
    description: string;
    kind: 'note' | 'document' | 'pdf' | 'video';
    noteBody: string;
    externalUrl: string;
    file: File | null;
  }) => Promise<void>;
  showResourceModal: boolean;
  onCloseResourceModal: () => void;
}

export const ClassResourcesTab: React.FC<Props> = ({
  teacherClass,
  isStudent,
  uploadClassResource,
  showResourceModal,
  onCloseResourceModal,
}) => {
  const { addNotification } = useNotifications();
  const [classResourceTitle, setClassResourceTitle] = useState('');
  const [classResourceDescription, setClassResourceDescription] = useState('');
  const [classResourceKind, setClassResourceKind] = useState<'note' | 'document' | 'pdf' | 'video'>('note');
  const [classResourceNote, setClassResourceNote] = useState('');
  const [classResourceLink, setClassResourceLink] = useState('');
  const [classResourceFile, setClassResourceFile] = useState<File | null>(null);
  const [classResourceError, setClassResourceError] = useState('');
  const [isUploadingResource, setIsUploadingResource] = useState(false);

  return (
    <>
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Class resources</p>
            <p className="mt-2 text-xl font-semibold text-[color:var(--hub-text)]">Notes, files, and lesson media</p>
          </div>
          {!isStudent ? (
            <button type="button" onClick={onCloseResourceModal} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" />
              Add resource
            </button>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4">
          {teacherClass.resources.length > 0 ? (
            teacherClass.resources.map((resource) => (
              <div key={resource.id} className="rounded-[24px] border border-[color:var(--hub-border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{resource.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">
                      {resource.kind} • {resource.createdByName} • {formatHubDateTime(resource.createdAt)}
                    </p>
                  </div>
                  {resource.fileUrl || resource.externalUrl ? (
                    <a href={resource.fileUrl || resource.externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-primary)]">
                      <Link2 className="h-3.5 w-3.5" />
                      Open
                    </a>
                  ) : null}
                </div>
                {resource.description ? <p className="mt-2 text-sm text-[color:var(--hub-muted)]">{resource.description}</p> : null}
                {resource.noteBody ? (
                  <div className="mt-3 rounded-2xl bg-[color:var(--hub-soft)] px-3 py-2 text-sm text-[color:var(--hub-muted)]">{resource.noteBody}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[24px] bg-[color:var(--hub-soft)] p-4 text-sm text-[color:var(--hub-muted)]">No class resources yet.</div>
          )}
        </div>
      </section>

      <ActionModal isOpen={showResourceModal && !isStudent} title="Add class resource" description="Upload notes, documents, PDFs, or recorded videos." onClose={onCloseResourceModal}>
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (!classResourceTitle.trim()) { setClassResourceError('Resource title is required.'); return; }
          if (classResourceKind === 'note' && !classResourceNote.trim()) { setClassResourceError('Add your note content.'); return; }
          if (classResourceKind !== 'note' && !classResourceFile && !classResourceLink.trim()) { setClassResourceError('Upload a file or provide a link.'); return; }
          try {
            setIsUploadingResource(true);
            setClassResourceError('');
            await uploadClassResource({ classId: teacherClass.id, title: classResourceTitle.trim(), description: classResourceDescription.trim(), kind: classResourceKind, noteBody: classResourceKind === 'note' ? classResourceNote : '', externalUrl: classResourceKind !== 'note' ? classResourceLink.trim() : '', file: classResourceKind !== 'note' ? classResourceFile : null });
            setClassResourceTitle(''); setClassResourceDescription(''); setClassResourceKind('note'); setClassResourceNote(''); setClassResourceLink(''); setClassResourceFile(null);
            onCloseResourceModal();
            addNotification({ type: 'success', title: 'Resource added', message: 'Students can now access this material.', duration: 2200 });
          } catch (error) {
            setClassResourceError(error instanceof Error ? error.message : 'Could not upload resource.');
          } finally {
            setIsUploadingResource(false);
          }
        }}>
          <input value={classResourceTitle} onChange={(e) => { setClassResourceTitle(e.target.value); if (classResourceError) setClassResourceError(''); }} placeholder="Resource title *" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <input value={classResourceDescription} onChange={(e) => setClassResourceDescription(e.target.value)} placeholder="Short description (optional)" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          <select value={classResourceKind} onChange={(e) => { const k = e.target.value as 'note' | 'document' | 'pdf' | 'video'; setClassResourceKind(k); if (k === 'note') { setClassResourceFile(null); setClassResourceLink(''); } }} className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none">
            <option value="note">Note</option>
            <option value="document">Document</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
          </select>
          {classResourceKind === 'note' ? (
            <textarea value={classResourceNote} onChange={(e) => { setClassResourceNote(e.target.value); if (classResourceError) setClassResourceError(''); }} rows={6} placeholder="Write your notes *" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
          ) : (
            <div className="grid gap-3">
              <input value={classResourceLink} onChange={(e) => { setClassResourceLink(e.target.value); if (classResourceError) setClassResourceError(''); }} placeholder="Optional external link" className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 outline-none" />
              <div className="grid gap-2 rounded-2xl border border-[color:var(--hub-border)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-muted)]">Upload file</p>
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg,video/mp4,video/webm,video/quicktime,.mov,.m4v" onChange={(e) => { setClassResourceFile(e.target.files?.[0] || null); if (classResourceError) setClassResourceError(''); }} className="rounded-xl border border-[color:var(--hub-border)] px-3 py-2 text-sm outline-none file:mr-3 file:rounded-full file:border file:border-[color:var(--hub-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold" />
                {classResourceFile ? <span className="inline-flex w-fit rounded-full bg-[color:var(--hub-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--hub-text)]">{classResourceFile.name}</span> : null}
              </div>
            </div>
          )}
          {classResourceError ? <p className="text-xs text-[color:var(--edu-danger)]">{classResourceError}</p> : null}
          <button type="submit" disabled={isUploadingResource} className="rounded-full bg-[color:var(--hub-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isUploadingResource ? 'Uploading...' : 'Add resource'}</button>
        </form>
      </ActionModal>
    </>
  );
};
