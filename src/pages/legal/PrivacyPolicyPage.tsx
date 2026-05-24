import React from 'react';
import { Link } from 'react-router-dom';
import { SkillStreamLogo } from '../../components/branding/SkillStreamLogo';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-10">
    <h2 className="text-xl font-bold text-[color:var(--hub-text)]">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-[color:var(--hub-muted)]">{children}</div>
  </div>
);

export const PrivacyPolicyPage: React.FC = () => (
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
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[color:var(--hub-text)]">Privacy Policy</h1>
      <p className="mt-3 text-sm text-[color:var(--hub-muted)]">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <Section title="1. Who we are">
        <p>SkillStream ("we", "us", "our") is an online platform that enables educators to host live lessons, manage students, and receive payments. References to "you" mean teachers, students, and administrators using the platform.</p>
      </Section>

      <Section title="2. Information we collect">
        <p><strong className="text-[color:var(--hub-text)]">Account information:</strong> When you register, we collect your name, email address, and a hashed password.</p>
        <p><strong className="text-[color:var(--hub-text)]">Usage data:</strong> We collect information about how you use the platform, including pages visited, lessons attended, and actions taken.</p>
        <p><strong className="text-[color:var(--hub-text)]">Payment information:</strong> Payments are processed by our third-party payment provider. We do not store full card details on our servers.</p>
        <p><strong className="text-[color:var(--hub-text)]">Communications:</strong> Messages sent between teachers and students through the platform are stored to enable the service.</p>
        <p><strong className="text-[color:var(--hub-text)]">Technical data:</strong> We may collect IP addresses, browser type, and device information for security and analytics purposes.</p>
      </Section>

      <Section title="3. How we use your information">
        <p>We use your data to: provide and improve the platform; process payments and subscriptions; send service-related notifications; respond to support requests; and comply with legal obligations.</p>
        <p>We do not sell your personal data to third parties.</p>
      </Section>

      <Section title="4. Data sharing">
        <p>We share data only with: payment processors (to handle transactions); infrastructure providers (to host the service); and where required by law.</p>
        <p>Teacher and student data is never shared with other teachers or students beyond what is necessary for the lesson experience (e.g. your name appearing in a class).</p>
      </Section>

      <Section title="5. Data retention">
        <p>We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain it for legal or accounting purposes.</p>
      </Section>

      <Section title="6. Cookies">
        <p>We use essential cookies to keep you logged in and to secure your session. We do not use advertising cookies or third-party tracking cookies.</p>
      </Section>

      <Section title="7. Your rights">
        <p>You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your data; and object to certain processing.</p>
        <p>To exercise these rights, contact us at the address below.</p>
      </Section>

      <Section title="8. Security">
        <p>We use industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and access controls. No system is 100% secure; please use a strong unique password.</p>
      </Section>

      <Section title="9. Children">
        <p>SkillStream is not directed at children under 13. If you believe a child has provided us personal data without parental consent, please contact us immediately.</p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email or in-app notice.</p>
      </Section>

      <Section title="11. Contact">
        <p>For privacy-related questions, contact us at: <strong className="text-[color:var(--hub-text)]">privacy@skillstream.app</strong></p>
      </Section>

      <div className="mt-12 border-t border-[color:var(--hub-border)] pt-8 text-sm text-[color:var(--hub-muted)]">
        <Link to="/terms" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Terms of Service</Link>
        <span className="mx-3">·</span>
        <Link to="/" className="hover:underline">Back to home</Link>
      </div>
    </main>
  </div>
);
