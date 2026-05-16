import React, { useEffect, useMemo, useState } from 'react';
import { Check, Users } from 'lucide-react';
import { PaymentTable } from '../components/hub/PaymentTable';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';

type PlanId = 'creator' | 'studio' | 'academy';

interface PlanTier {
  id: PlanId;
  name: string;
  monthlyFee: number;
  includedParticipantMinutes: number;
  overagePerMinute: number;
  transactionFeePercent: number;
}

const PLAN_TIERS: PlanTier[] = [
  { id: 'creator', name: 'Creator', monthlyFee: 39, includedParticipantMinutes: 10_000, overagePerMinute: 0.002, transactionFeePercent: 8 },
  { id: 'studio', name: 'Studio', monthlyFee: 89, includedParticipantMinutes: 40_000, overagePerMinute: 0.002, transactionFeePercent: 6 },
  { id: 'academy', name: 'Academy', monthlyFee: 199, includedParticipantMinutes: 150_000, overagePerMinute: 0.002, transactionFeePercent: 5 },
];

const formatMinutes = (value: number) => new Intl.NumberFormat('en-GB').format(value);
const formatGbp = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }).format(value);
const monthStartIso = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
const nextMonthStartIso = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

export const PaymentsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const allPayments = useTeacherHubStore((state) => state.payments);
  const classes = useTeacherHubStore((state) => state.classes);
  const students = useTeacherHubStore((state) => state.students);
  const currentStudent = students.find((entry) => entry.email.toLowerCase() === (user?.email || '').toLowerCase());
  const payments = isStudent
    ? currentStudent
      ? allPayments.filter((payment) => payment.studentId === currentStudent.id)
      : []
    : allPayments;
  const [activePlanId, setActivePlanId] = useState<PlanId>('studio');
  const [pendingPlan, setPendingPlan] = useState<{ id: PlanId; effectiveAt: string } | null>(null);

  const now = new Date();
  const currentMonthStart = monthStartIso(now);
  const nextMonthStart = nextMonthStartIso(now);

  useEffect(() => {
    if (pendingPlan && pendingPlan.effectiveAt <= currentMonthStart) {
      setActivePlanId(pendingPlan.id);
      setPendingPlan(null);
    }
  }, [currentMonthStart, pendingPlan]);

  const activePlan = PLAN_TIERS.find((plan) => plan.id === activePlanId) || PLAN_TIERS[1];
  const monthlyParticipantMinutes = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return classes
      .flatMap((entry) => entry.lessons)
      .filter((lesson) => {
        const date = new Date(lesson.scheduledAt);
        return date.getMonth() === month && date.getFullYear() === year;
      })
      .reduce((sum, lesson) => sum + lesson.studentCount * lesson.durationMinutes, 0);
  }, [classes]);
  const includedMinutes = activePlan.includedParticipantMinutes;
  const overageMinutes = Math.max(monthlyParticipantMinutes - includedMinutes, 0);
  const overageAmount = overageMinutes * activePlan.overagePerMinute;
  const projectedMonthlyTotal = activePlan.monthlyFee + overageAmount;
  const usagePercentage = Math.min((monthlyParticipantMinutes / includedMinutes) * 100, 100);
  const pendingPlanDetails = pendingPlan ? PLAN_TIERS.find((plan) => plan.id === pendingPlan.id) || null : null;

  return (
    <div className="space-y-6">
      {!isStudent ? (
        <>
          <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Current plan</p>
                <h3 className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">{activePlan.name}</h3>
                <p className="mt-1 text-sm text-[color:var(--hub-muted)]">Live usage resets every month.</p>
                {pendingPlanDetails ? (
                  <p className="mt-2 text-sm font-medium text-[color:var(--hub-primary)]">
                    Scheduled: switch to {pendingPlanDetails.name} on {new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(pendingPlan?.effectiveAt ?? ''))}
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">Projected bill</p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--hub-text)]">{formatGbp(projectedMonthlyTotal)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-[color:var(--hub-border)] p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[color:var(--hub-text)]">Live minute usage</span>
                <span className="text-[color:var(--hub-muted)]">{formatMinutes(monthlyParticipantMinutes)} / {formatMinutes(includedMinutes)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-[color:var(--hub-soft)]">
                <div className="h-2.5 rounded-full bg-[color:var(--hub-primary)] transition-all" style={{ width: `${usagePercentage}%` }} />
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-[color:var(--hub-soft)] p-3">
                  <p className="text-[color:var(--hub-muted)]">Base fee</p>
                  <p className="mt-1 font-semibold text-[color:var(--hub-text)]">{formatGbp(activePlan.monthlyFee)}</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--hub-soft)] p-3">
                  <p className="text-[color:var(--hub-muted)]">Included minutes</p>
                  <p className="mt-1 font-semibold text-[color:var(--hub-text)]">{formatMinutes(includedMinutes)}</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--hub-soft)] p-3">
                  <p className="text-[color:var(--hub-muted)]">Overage minutes</p>
                  <p className="mt-1 font-semibold text-[color:var(--hub-text)]">{formatMinutes(overageMinutes)}</p>
                </div>
                <div className="rounded-2xl bg-[color:var(--hub-soft)] p-3">
                  <p className="text-[color:var(--hub-muted)]">Overage charge</p>
                  <p className="mt-1 font-semibold text-[color:var(--hub-text)]">{formatGbp(overageAmount)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <Users className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Plan tiers</p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {PLAN_TIERS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    if (plan.id === activePlan.id) return;
                    setPendingPlan({ id: plan.id, effectiveAt: nextMonthStart });
                  }}
                  className={`rounded-3xl border p-4 text-left transition ${
                    plan.id === activePlan.id
                      ? 'border-[color:var(--hub-primary)] bg-[color:var(--hub-soft)]'
                      : pendingPlan?.id === plan.id
                      ? 'border-[rgba(27,74,128,0.35)] bg-[rgba(27,74,128,0.06)]'
                      : 'border-[color:var(--hub-border)] hover:border-[rgba(27,74,128,0.32)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-[color:var(--hub-text)]">{plan.name}</p>
                    {plan.id === activePlan.id ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--hub-primary)] px-2.5 py-1 text-xs font-semibold text-white">
                        <Check className="h-3.5 w-3.5" />
                        Active
                      </span>
                    ) : null}
                    {pendingPlan?.id === plan.id ? (
                      <span className="inline-flex rounded-full border border-[rgba(27,74,128,0.35)] px-2.5 py-1 text-xs font-semibold text-[color:var(--hub-primary)]">
                        Scheduled next month
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">{formatGbp(plan.monthlyFee)}<span className="text-sm font-medium text-[color:var(--hub-muted)]"> /month</span></p>
                  <p className="mt-3 text-sm text-[color:var(--hub-muted)]">{formatMinutes(plan.includedParticipantMinutes)} participant-minutes included.</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{formatGbp(plan.overagePerMinute)} per extra participant-minute.</p>
                  <p className="mt-1 text-sm text-[color:var(--hub-muted)]">{plan.transactionFeePercent}% platform fee on paid one-off events.</p>
                  {plan.id !== activePlan.id ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--hub-primary)]">
                      Click to schedule for next month
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {payments.length > 0 ? (
        <>
          {!isStudent ? (
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Learner invoices</p>
              <PaymentTable payments={payments} />
            </div>
          ) : (
            <PaymentTable payments={payments} />
          )}
        </>
      ) : (
        <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 text-sm text-[color:var(--hub-muted)] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          No payment records yet.
        </div>
      )}

    </div>
  );
};
