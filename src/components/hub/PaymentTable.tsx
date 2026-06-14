import React from 'react';
import { PaymentRecord } from '../../data/teacherHub';
import { useCurrencyFormatter } from '../../lib/currency';
import { cn } from '../../lib/utils';

const toneClasses: Record<PaymentRecord['status'], string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-sky-100 text-sky-700',
  overdue: 'bg-amber-100 text-amber-700',
};

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));

export const PaymentTable: React.FC<{ payments: PaymentRecord[] }> = ({ payments }) => {
  const { format: formatMoney } = useCurrencyFormatter();
  return (
    <div className="overflow-hidden rounded-[28px] border border-[color:var(--hub-border)] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[color:var(--hub-soft)]">
            <tr className="text-xs uppercase tracking-[0.18em] text-[color:var(--hub-muted)]">
              <th className="px-5 py-4 font-semibold">Student</th>
              <th className="px-5 py-4 font-semibold">Class</th>
              <th className="px-5 py-4 font-semibold">Amount</th>
              <th className="px-5 py-4 font-semibold">Due</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-[color:var(--hub-border)]">
                <td className="px-5 py-4 text-sm font-semibold text-[color:var(--hub-text)]">{payment.studentName}</td>
                <td className="px-5 py-4 text-sm text-[color:var(--hub-muted)]">{payment.className}</td>
                <td className="px-5 py-4 text-sm text-[color:var(--hub-text)]">{formatMoney(payment.amount)}</td>
                <td className="px-5 py-4 text-sm text-[color:var(--hub-muted)]">{formatDate(payment.dueAt)}</td>
                <td className="px-5 py-4 text-sm">
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', toneClasses[payment.status])}>{payment.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
