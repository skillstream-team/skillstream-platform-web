import React from 'react';
import { Link } from 'react-router-dom';
import { SkillStreamLogo } from '../../components/branding/SkillStreamLogo';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-10">
    <h2 className="text-xl font-bold text-[color:var(--hub-text)]">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-[color:var(--hub-muted)]">{children}</div>
  </div>
);

export const RefundPolicyPage: React.FC = () => (
  <div className="min-h-screen bg-[color:var(--hub-bg)]">
    <header className="border-b border-[color:var(--hub-border)] bg-white px-6 py-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <SkillStreamLogo to="/" />
        <Link to="/register" className="rounded-full bg-[color:var(--hub-primary)] px-4 py-2 text-sm font-semibold text-white">
          Get started
        </Link>
      </div>
    </header>

    <main className="mx-auto max-w-4xl px-6 py-14 pb-24">
      <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--hub-primary)]">Legal</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[color:var(--hub-text)]">Refund Policy</h1>
      <p className="mt-3 text-sm text-[color:var(--hub-muted)]">Last updated: 12 July 2026</p>

      <Section title="1. Overview">
        <p>This policy explains when you are entitled to a refund from SkillStream and how to claim one. It covers two types of payment: teacher subscriptions and student lesson purchases.</p>
        <p>All refunds are returned to the original payment method and are processed in United States Dollars (USD). Please allow 5–10 business days for the funds to appear in your account after we approve your request.</p>
      </Section>

      <Section title="2. Teacher subscriptions">
        <p><strong className="text-[color:var(--hub-text)]">7-day cooling-off period:</strong> If you are a new subscriber and you cancel within 7 days of your first payment, and you have not yet hosted any paid lessons during that period, you are entitled to a full refund of your first month's subscription fee. To claim this, email <strong className="text-[color:var(--hub-text)]">legal@skillstream.app</strong> from your registered email address within the 7-day window.</p>
        <p><strong className="text-[color:var(--hub-text)]">Renewals and ongoing subscriptions:</strong> Subscription fees are non-refundable after the cooling-off period has passed or after you have hosted a paid lesson. If you cancel a subscription renewal, your access continues until the end of the current paid billing period. No pro-rata refund is issued for unused days.</p>
        <p><strong className="text-[color:var(--hub-text)]">Plan changes:</strong> If you upgrade your plan mid-cycle, you will be charged only the difference for the remaining days. Downgrades take effect at the next renewal date.</p>
      </Section>

      <Section title="3. Student lesson purchases">
        <p><strong className="text-[color:var(--hub-text)]">Completed lessons:</strong> Payments for lessons that have taken place are not refundable, except in the circumstances described below.</p>
        <p><strong className="text-[color:var(--hub-text)]">Teacher-cancelled lessons:</strong> If a teacher cancels a paid lesson and does not reschedule it within a reasonable time (generally 7 days), you are automatically entitled to a full refund of that lesson's payment. Contact <strong className="text-[color:var(--hub-text)]">legal@skillstream.app</strong> with the lesson details if a refund has not been processed within 5 business days.</p>
        <p><strong className="text-[color:var(--hub-text)]">Technical failure:</strong> If a serious technical fault on SkillStream's side prevented a lesson from taking place (e.g. platform outage, not a connectivity issue on your end), you may request a refund or lesson credit within 48 hours of the scheduled start time. We will investigate and respond within 3 business days.</p>
        <p><strong className="text-[color:var(--hub-text)]">No-show:</strong> If you miss a lesson without notifying the teacher in advance, no refund is issued. This is at the teacher's discretion if they have their own cancellation policy.</p>
      </Section>

      <Section title="4. How to request a refund">
        <p>Email <strong className="text-[color:var(--hub-text)]">legal@skillstream.app</strong> with the following:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Your registered email address</li>
          <li>The date and amount of the payment in question</li>
          <li>A brief description of why you are requesting a refund</li>
        </ul>
        <p>We will acknowledge your request within 2 business days and provide a decision within 5 business days. If we need additional information, we will contact you.</p>
      </Section>

      <Section title="5. Disputes and chargebacks">
        <p>We encourage you to contact us before raising a chargeback with your bank or payment provider, as we can usually resolve issues faster directly. If you initiate a chargeback without first contacting us, we may suspend your account pending resolution.</p>
      </Section>

      <Section title="6. Consumer rights">
        <p>Nothing in this policy limits your rights under the Consumer Protection Act [Chapter 14:44] of Zimbabwe or any other applicable mandatory consumer protection law.</p>
      </Section>

      <Section title="7. Contact">
        <p>For refund requests and payment questions: <strong className="text-[color:var(--hub-text)]">legal@skillstream.app</strong></p>
      </Section>

      <div className="mt-12 border-t border-[color:var(--hub-border)] pt-8 text-sm text-[color:var(--hub-muted)]">
        <Link to="/terms" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Terms of Service</Link>
        <span className="mx-3">·</span>
        <Link to="/privacy" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Privacy Policy</Link>
        <span className="mx-3">·</span>
        <Link to="/acceptable-use" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Acceptable Use Policy</Link>
        <span className="mx-3">·</span>
        <Link to="/" className="hover:underline">Back to home</Link>
      </div>
    </main>
  </div>
);
