import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ChevronRight, Clock, Plus, Route, Trash2, Users, X } from 'lucide-react';
import { ActionModal } from '../../components/common/ActionModal';
import { useNotifications } from '../../components/notifications/NotificationToast';
import { useOrgHubStore } from '../../store/orgHub';
import { LearningPath } from '../../data/orgHub';

export const OrgPathsPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { paths, members, isHydrated, isSyncing, loadOrgHub, createPath, deletePath } = useOrgHubStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  if (!isHydrated || isSyncing) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />)}</div>;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setIsCreating(true);
      const pathId = await createPath({ title: newTitle.trim(), description: newDesc.trim() });
      setShowCreate(false); setNewTitle(''); setNewDesc('');
      navigate(`/org/${orgId}/paths/${pathId}`);
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not create path.', duration: 2500 });
    } finally { setIsCreating(false); }
  };

  const handleDelete = (path: LearningPath) => {
    setPendingConfirm({
      title: 'Delete learning path',
      description: `Delete "${path.title}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deletePath(path.id);
          addNotification({ type: 'success', title: 'Path deleted', message: '', duration: 1800 });
        } catch (err) {
          addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not delete path.', duration: 2500 });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Learning</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Learning Paths</h2>
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Group courses into structured journeys for your team.</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New path
          </button>
        </div>
      </section>

      {showCreate ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--hub-text)]">New learning path</p>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-full p-1.5 text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Path title" required className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short description (optional)" className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
            <button type="submit" disabled={isCreating} className="rounded-full bg-[color:var(--hub-primary)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{isCreating ? 'Creating…' : 'Create'}</button>
          </form>
        </div>
      ) : null}

      {paths.length === 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center">
          <Route className="mx-auto h-10 w-10 text-[color:var(--hub-muted)]" />
          <p className="mt-4 text-sm font-semibold text-[color:var(--hub-text)]">No learning paths yet</p>
          <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Create a path to sequence courses into a structured journey.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paths.map((path) => {
            const totalMinutes = path.courses.reduce((s, c) => s + (c.estimatedMinutes ?? 0), 0);
            const learnerCount = members.filter((m) => m.orgRole === 'learner' || m.orgRole === 'manager').length;
            return (
              <div key={path.id} className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
                <div className="flex items-start justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${path.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]'}`}>
                    {path.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <button type="button" onClick={() => handleDelete(path)} className="shrink-0 rounded-full p-1.5 text-[color:var(--hub-muted)] hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="mt-3 text-base font-semibold text-[color:var(--hub-text)]">{path.title}</h3>
                {path.description ? <p className="mt-1 line-clamp-2 text-sm text-[color:var(--hub-muted)]">{path.description}</p> : null}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[color:var(--hub-muted)]">
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{path.courses.length} course{path.courses.length !== 1 ? 's' : ''}</span>
                  {totalMinutes > 0 ? <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span> : null}
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{learnerCount} org learners</span>
                </div>
                <div className="mt-4 space-y-1.5">
                  {path.courses.slice(0, 3).map((pc, i) => (
                    <div key={pc.id} className="flex items-center gap-2 text-xs text-[color:var(--hub-muted)]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-soft)] text-[10px] font-bold">{i + 1}</span>
                      <span className="truncate">{pc.courseTitle}</span>
                    </div>
                  ))}
                  {path.courses.length > 3 ? <p className="text-xs text-[color:var(--hub-muted)]">+{path.courses.length - 3} more</p> : null}
                </div>
                <button type="button" onClick={() => navigate(`/org/${orgId}/paths/${path.id}`)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--hub-primary)] py-2.5 text-sm font-semibold text-white">
                  Manage path <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ActionModal isOpen={!!pendingConfirm} title={pendingConfirm?.title ?? ''} description={pendingConfirm?.description} onClose={() => setPendingConfirm(null)}>
        <div className="flex gap-3">
          <button type="button" onClick={() => setPendingConfirm(null)} className="flex-1 rounded-full border border-[color:var(--hub-border)] py-2.5 text-sm font-semibold text-[color:var(--hub-text)]">Cancel</button>
          <button type="button" onClick={() => { void pendingConfirm?.onConfirm(); setPendingConfirm(null); }} className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
        </div>
      </ActionModal>
    </div>
  );
};
