import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bell, Plus, Trash2, X } from 'lucide-react';
import { ActionModal } from '../../components/common/ActionModal';
import { useNotifications } from '../../components/notifications/NotificationToast';
import { useOrgHubStore } from '../../store/orgHub';
import { formatHubDateTime } from '../../lib/utils';

export const OrgAnnouncementsPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const { addNotification } = useNotifications();
  const { announcements, isHydrated, isSyncing, loadOrgHub, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useOrgHubStore();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expires, setExpires] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  if (!isHydrated || isSyncing) {
    return <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />)}</div>;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    try {
      setIsSaving(true);
      await createAnnouncement({ title: title.trim(), body: body.trim(), expiresAt: expires || undefined });
      setTitle(''); setBody(''); setExpires(''); setShowCreate(false);
      addNotification({ type: 'success', title: 'Announcement posted', message: '', duration: 1800 });
    } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not post announcement.', duration: 2500 });
    } finally { setIsSaving(false); }
  };

  const handleDelete = (id: string) => {
    setPendingConfirm({
      title: 'Delete announcement',
      description: 'This announcement will be removed permanently.',
      onConfirm: async () => {
        try { await deleteAnnouncement(id); addNotification({ type: 'success', title: 'Deleted', message: '', duration: 1500 }); } catch (err) {
          addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not delete.', duration: 2500 });
        }
      },
    });
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try { await updateAnnouncement(id, { isActive: !current }); } catch (err) {
      addNotification({ type: 'error', title: 'Error', message: err instanceof Error ? err.message : 'Could not update.', duration: 2500 });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">Communications</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Announcements</h2>
            <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Post notices that appear in your learners' dashboard.</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> New announcement
          </button>
        </div>
      </section>

      {showCreate ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--hub-text)]">New announcement</p>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-full p-1.5 text-[color:var(--hub-muted)] hover:bg-[color:var(--hub-soft)]"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body…" required rows={4} className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none resize-none" />
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-[color:var(--hub-muted)]">Expires (optional)</label>
                <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-4 py-3 text-sm outline-none" />
              </div>
              <button type="submit" disabled={isSaving} className="self-end rounded-full bg-[color:var(--hub-primary)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {isSaving ? 'Posting…' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {announcements.length === 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-[color:var(--hub-muted)]" />
          <p className="mt-4 text-sm font-semibold text-[color:var(--hub-text)]">No announcements yet</p>
          <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Post a notice and it'll appear in all learners' dashboards.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className={`rounded-[28px] border bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${ann.isActive ? 'border-[color:var(--hub-border)]' : 'border-[color:var(--hub-border)] opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[color:var(--hub-text)]">{ann.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ann.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]'}`}>
                      {ann.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{ann.body}</p>
                  <div className="mt-2 flex gap-4 text-xs text-[color:var(--hub-muted)]">
                    <span>Posted {formatHubDateTime(ann.createdAt)}</span>
                    {ann.expiresAt ? <span>Expires {formatHubDateTime(ann.expiresAt)}</span> : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => handleToggleActive(ann.id, ann.isActive)} className="rounded-full border border-[color:var(--hub-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]">
                    {ann.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" onClick={() => handleDelete(ann.id)} className="rounded-full p-1.5 text-[color:var(--hub-muted)] hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
