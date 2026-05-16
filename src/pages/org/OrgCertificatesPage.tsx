import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Award, Download, Search } from 'lucide-react';
import { useOrgHubStore } from '../../store/orgHub';
import { buildCertificateHtml, formatHubDateTime } from '../../lib/utils';

export const OrgCertificatesPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const { org, enrollments, members, isHydrated, isSyncing, loadOrgHub } = useOrgHubStore();
  const [search, setSearch] = useState('');

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  const certificates = useMemo(() => (
    enrollments
      .filter((e) => e.hasCertificate && e.completedAt)
      .map((e) => {
        const member = members.find((m) => m.userId === e.userId);
        return {
          id: e.id,
          enrollmentId: e.id,
          learnerName: e.userName,
          learnerEmail: e.userEmail,
          courseTitle: e.courseTitle,
          completedAt: e.completedAt!,
          department: member?.department,
        };
      })
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  ), [enrollments, members]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return certificates;
    return certificates.filter(
      (c) => c.learnerName.toLowerCase().includes(q) || c.courseTitle.toLowerCase().includes(q) || c.learnerEmail.toLowerCase().includes(q),
    );
  }, [certificates, search]);

  if (!isHydrated || isSyncing) return <div className="h-96 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--hub-text)]">Certificates</h1>
          <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} issued</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--hub-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--hub-text)] hover:bg-[color:var(--hub-soft)]"
          onClick={() => {
            const csv = ['Learner,Email,Course,Completed'].concat(
              filtered.map((c) => `"${c.learnerName}","${c.learnerEmail}","${c.courseTitle}","${c.completedAt}"`),
            ).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'certificates.csv'; a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--hub-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by learner or course..."
          className="w-full rounded-2xl border border-[color:var(--hub-border)] bg-white py-2.5 pl-11 pr-4 text-sm text-[color:var(--hub-text)] placeholder:text-[color:var(--hub-muted)] focus:border-[color:var(--hub-primary)] focus:outline-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total issued', value: certificates.length },
          { label: 'Unique learners', value: new Set(certificates.map((c) => c.learnerName)).size },
          { label: 'Courses covered', value: new Set(certificates.map((c) => c.courseTitle)).size },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
              <Award className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[color:var(--hub-text)]">{value}</p>
            <p className="mt-0.5 text-xs font-semibold text-[color:var(--hub-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.05)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[color:var(--hub-muted)]">
            {search ? 'No certificates match your search.' : 'No certificates issued yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--hub-border)] bg-[color:var(--hub-soft)]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">Learner</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">Course</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">Completed</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--hub-muted)]">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--hub-border)]">
              {filtered.map((cert) => (
                <tr key={cert.id} className="hover:bg-[color:var(--hub-soft)]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--hub-primary)] text-xs font-bold text-white">
                        {cert.learnerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[color:var(--hub-text)]">{cert.learnerName}</p>
                        <p className="text-xs text-[color:var(--hub-muted)]">{cert.learnerEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-[color:var(--hub-text)]">{cert.courseTitle}</p>
                    {cert.department ? <p className="text-xs text-[color:var(--hub-muted)]">{cert.department}</p> : null}
                  </td>
                  <td className="px-6 py-4 text-[color:var(--hub-muted)]">{formatHubDateTime(cert.completedAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      onClick={() => {
                        const html = buildCertificateHtml({
                          learnerName: cert.learnerName,
                          courseTitle: cert.courseTitle,
                          orgName: org?.name ?? 'SkillStream',
                          issuedAt: new Date(cert.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                        });
                        const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
                        window.open(url, '_blank');
                      }}
                    >
                      <Award className="h-3.5 w-3.5" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
