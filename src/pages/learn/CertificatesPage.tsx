import React, { useEffect } from 'react';
import { Award, Download } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useLearnerHubStore } from '../../store/learnerHub';
import { formatHubDateTime } from '../../lib/utils';

export const CertificatesPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { certificates, isHydrated, isSyncing, loadLearnerHub, downloadCertificate } = useLearnerHubStore();

  useEffect(() => {
    if (user?.id) void loadLearnerHub(user.id);
  }, [user?.id, loadLearnerHub]);

  if (!isHydrated || isSyncing) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1,2].map((i) => <div key={i} className="h-40 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--hub-primary)]">My Learning</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--hub-text)]">Certificates</h2>
        <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned</p>
      </section>

      {certificates.length === 0 ? (
        <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-12 text-center shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <Award className="mx-auto h-10 w-10 text-[color:var(--hub-muted)]" />
          <p className="mt-4 text-sm font-semibold text-[color:var(--hub-text)]">No certificates yet</p>
          <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Complete a course to earn your first certificate.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[color:var(--hub-text)]">{cert.courseTitle}</h3>
              <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{cert.orgName}</p>
              <p className="mt-2 text-xs text-[color:var(--hub-muted)]">Issued {formatHubDateTime(cert.issuedAt)}</p>
              <button
                type="button"
                onClick={() => void downloadCertificate(cert.id, user?.name ?? user?.email ?? 'Learner')}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--hub-border)] py-2 text-sm font-semibold text-[color:var(--hub-text)] transition hover:bg-[color:var(--hub-soft)]"
              >
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
