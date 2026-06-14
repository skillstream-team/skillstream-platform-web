import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, CreditCard, Download, Zap } from 'lucide-react';
import { useOrgHubStore } from '../../store/orgHub';
import { cn } from '../../lib/utils';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 149,
    seats: 50,
    features: ['Up to 50 learners', 'Unlimited courses', 'Basic reporting', 'Email reminders', 'Certificate generation'],
  },
  {
    key: 'growth',
    name: 'Growth',
    price: 349,
    seats: 200,
    features: ['Up to 200 learners', 'Unlimited courses', 'Advanced analytics', 'Scheduled reports', 'Learning paths', 'Priority support'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: null,
    seats: null,
    features: ['Unlimited learners', 'Custom SSO / SAML', 'Dedicated CSM', 'SLA guarantee', 'Custom integrations', 'Audit log'],
  },
];

const DEMO_INVOICES = [
  { id: 'inv-001', date: '2026-05-01', amount: 149, status: 'paid', plan: 'Starter' },
  { id: 'inv-002', date: '2026-04-01', amount: 149, status: 'paid', plan: 'Starter' },
  { id: 'inv-003', date: '2026-03-01', amount: 149, status: 'paid', plan: 'Starter' },
  { id: 'inv-004', date: '2026-02-01', amount: 149, status: 'paid', plan: 'Starter' },
];

export const OrgBillingPage: React.FC = () => {
  const { orgId = '' } = useParams();
  const { org, members, isHydrated, isSyncing, loadOrgHub } = useOrgHubStore();
  const [currentPlan] = useState('starter');

  useEffect(() => { if (orgId) void loadOrgHub(orgId); }, [orgId, loadOrgHub]);

  const seatUsage = members.filter((m) => m.orgRole === 'learner' || m.orgRole === 'manager').length;
  const seatLimit = org?.seatLimit ?? 50;
  const seatPct = Math.min(100, Math.round((seatUsage / seatLimit) * 100));

  if (!isHydrated || isSyncing) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-[32px] bg-[color:var(--hub-soft)]" />)}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--hub-text)]">Billing & Plan</h1>
        <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Manage your subscription and view invoices.</p>
      </div>

      {/* Seat usage */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Seat Usage</p>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-[color:var(--hub-muted)]">{seatUsage} of {seatLimit} seats used</span>
              <span className={cn('font-semibold', seatPct >= 90 ? 'text-red-600' : seatPct >= 70 ? 'text-amber-600' : 'text-emerald-600')}>{seatPct}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[color:var(--hub-soft)]">
              <div
                className={cn('h-full rounded-full transition-all', seatPct >= 90 ? 'bg-red-500' : seatPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')}
                style={{ width: `${seatPct}%` }}
              />
            </div>
          </div>
        </div>
        {seatPct >= 80 ? (
          <p className="mt-3 text-xs font-semibold text-amber-700">You&apos;re approaching your seat limit. Consider upgrading to Growth.</p>
        ) : null}
      </div>

      {/* Plans */}
      <div>
        <p className="mb-4 text-sm font-semibold text-[color:var(--hub-muted)] uppercase tracking-[0.18em]">Available Plans</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            return (
              <div
                key={plan.key}
                className={cn('relative rounded-[28px] border p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all', isCurrent ? 'border-[color:var(--hub-primary)] bg-[rgba(27,74,128,0.03)]' : 'border-[color:var(--hub-border)] bg-white')}
              >
                {isCurrent ? (
                  <span className="absolute right-4 top-4 rounded-full bg-[color:var(--hub-primary)] px-2.5 py-0.5 text-xs font-semibold text-white">Current plan</span>
                ) : null}
                <p className="text-lg font-semibold text-[color:var(--hub-text)]">{plan.name}</p>
                <div className="mt-2">
                  {plan.price !== null ? (
                    <>
                      <span className="text-3xl font-bold text-[color:var(--hub-text)]">${plan.price}</span>
                      <span className="ml-1 text-sm text-[color:var(--hub-muted)]">/month</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-[color:var(--hub-text)]">Custom</span>
                  )}
                </div>
                {plan.seats ? (
                  <p className="mt-1 text-xs text-[color:var(--hub-muted)]">Up to {plan.seats} learners</p>
                ) : (
                  <p className="mt-1 text-xs text-[color:var(--hub-muted)]">Unlimited learners</p>
                )}
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[color:var(--hub-text)]">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isCurrent}
                  className={cn('mt-6 w-full rounded-2xl py-2.5 text-sm font-semibold transition-colors', isCurrent ? 'cursor-default bg-[color:var(--hub-soft)] text-[color:var(--hub-muted)]' : plan.key === 'enterprise' ? 'border border-[color:var(--hub-primary)] text-[color:var(--hub-primary)] hover:bg-[rgba(27,74,128,0.06)]' : 'bg-[color:var(--hub-primary)] text-white hover:opacity-90')}
                >
                  {isCurrent ? 'Active' : plan.key === 'enterprise' ? 'Contact sales' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment method */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Payment Method</p>
          <button type="button" className="text-sm font-semibold text-[color:var(--hub-primary)] hover:underline">Update</button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--hub-soft)]">
            <CreditCard className="h-5 w-5 text-[color:var(--hub-muted)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[color:var(--hub-text)]">Visa ending in 4242</p>
            <p className="text-xs text-[color:var(--hub-muted)]">Expires 12/2028</p>
          </div>
        </div>
      </div>

      {/* Invoice history */}
      <div className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Invoice History</p>
        {org?.id === 'demo-org' ? (
          <div className="divide-y divide-[color:var(--hub-border)]">
            {DEMO_INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[color:var(--hub-text)]">{inv.plan} — {new Date(inv.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-xs text-[color:var(--hub-muted)]">{inv.id}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 capitalize">{inv.status}</span>
                <p className="w-16 text-right text-sm font-semibold text-[color:var(--hub-text)]">${inv.amount}</p>
                <button type="button" className="flex items-center gap-1 text-xs font-semibold text-[color:var(--hub-primary)] hover:underline">
                  <Download className="h-3.5 w-3.5" /> PDF
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-[color:var(--hub-muted)]">Invoice history will appear here once your billing integration is active.</p>
        )}
      </div>

      {/* Enterprise CTA */}
      <div className="rounded-[32px] border border-[rgba(27,74,128,0.2)] bg-[rgba(27,74,128,0.04)] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--hub-primary)]">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-[color:var(--hub-text)]">Need more than 200 seats?</p>
            <p className="text-sm text-[color:var(--hub-muted)]">Our Enterprise plan offers unlimited learners, SSO, dedicated support, and custom integrations.</p>
          </div>
          <button type="button" className="ml-auto shrink-0 rounded-2xl bg-[color:var(--hub-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Contact sales
          </button>
        </div>
      </div>
    </div>
  );
};
