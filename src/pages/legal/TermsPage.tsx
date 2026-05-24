import React from 'react';
import { Link } from 'react-router-dom';
import { SkillStreamLogo } from '../../components/branding/SkillStreamLogo';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-10">
    <h2 className="text-xl font-bold text-[color:var(--hub-text)]">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-[color:var(--hub-muted)]">{children}</div>
  </div>
);

export const TermsPage: React.FC = () => (
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
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[color:var(--hub-text)]">Terms of Service</h1>
      <p className="mt-3 text-sm text-[color:var(--hub-muted)]">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <Section title="1. Acceptance">
        <p>By creating an account or using SkillStream, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be at least 18 years old to create a teacher account. Students under 18 may use the platform only with parental or guardian consent.</p>
      </Section>

      <Section title="3. Your account">
        <p>You are responsible for keeping your login credentials secure and for all activity under your account. Notify us immediately if you suspect unauthorised access.</p>
        <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
      </Section>

      <Section title="4. Teacher responsibilities">
        <p>Teachers are solely responsible for the content of their lessons, materials, and communications with students. You must not post illegal, harmful, or misleading content.</p>
        <p>Teachers set their own prices. SkillStream charges a platform fee on paid sessions as set out in your chosen subscription plan.</p>
      </Section>

      <Section title="5. Student responsibilities">
        <p>Students must treat teachers and other participants with respect. Disruptive or abusive behaviour may result in removal from a class or account suspension.</p>
      </Section>

      <Section title="6. Payments and subscriptions">
        <p>Teacher subscriptions are billed monthly and renew automatically. You can cancel at any time; cancellation takes effect at the end of the current billing period.</p>
        <p>Student payments for paid lessons are processed at checkout. Refunds are subject to the individual teacher's refund policy.</p>
        <p>Promotional codes and affiliate discounts are applied at checkout and cannot be combined unless stated otherwise.</p>
      </Section>

      <Section title="7. Affiliate programme">
        <p>Teachers may participate in the SkillStream affiliate programme by sharing their unique referral code. When a new teacher signs up using your code and activates a subscription, both parties receive a discount as configured at the time of referral.</p>
        <p>Affiliate discounts are applied to subscription fees only and have no cash value. SkillStream may modify or discontinue the affiliate programme at any time with reasonable notice.</p>
      </Section>

      <Section title="8. Intellectual property">
        <p>You retain ownership of content you create on the platform. By uploading content, you grant SkillStream a limited licence to display and deliver that content to your students as part of the service.</p>
        <p>The SkillStream brand, software, and design are our intellectual property. You may not copy, modify, or distribute them.</p>
      </Section>

      <Section title="9. Recordings">
        <p>Lesson recordings created through the platform are stored on your behalf. You are responsible for obtaining any necessary consents from participants before recording a session.</p>
      </Section>

      <Section title="10. Limitation of liability">
        <p>To the maximum extent permitted by law, SkillStream is not liable for indirect, incidental, or consequential losses arising from your use of the platform.</p>
      </Section>

      <Section title="11. Changes to these terms">
        <p>We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the revised terms.</p>
      </Section>

      <Section title="12. Governing law">
        <p>These Terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
      </Section>

      <Section title="13. Contact">
        <p>For questions about these Terms, contact us at: <strong className="text-[color:var(--hub-text)]">legal@skillstream.app</strong></p>
      </Section>

      <div className="mt-12 border-t border-[color:var(--hub-border)] pt-8 text-sm text-[color:var(--hub-muted)]">
        <Link to="/privacy" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Privacy Policy</Link>
        <span className="mx-3">·</span>
        <Link to="/" className="hover:underline">Back to home</Link>
      </div>
    </main>
  </div>
);
