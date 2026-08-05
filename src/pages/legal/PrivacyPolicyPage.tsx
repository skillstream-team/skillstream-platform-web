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
      <p className="mt-3 text-sm text-[color:var(--hub-muted)]">Last updated: 12 July 2026</p>

      <Section title="1. Who we are">
        <p>SkillStream ("we", "us", "our") is an online platform that enables educators to host live lessons, manage students, and receive payments. We are a data controller as defined under the Cyber and Data Protection Act [Chapter 12:07] of Zimbabwe (the "Act"). References to "you" mean teachers, students, and administrators using the platform.</p>
        <p>For data protection queries, contact us at: <strong className="text-[color:var(--hub-text)]">privacy@skillstream.world</strong></p>
      </Section>

      <Section title="2. Information we collect">
        <p><strong className="text-[color:var(--hub-text)]">Account information:</strong> When you register, we collect your name, email address, role (teacher or student), and a securely hashed password.</p>
        <p><strong className="text-[color:var(--hub-text)]">Profile and class data:</strong> Teachers may add class descriptions, lesson materials, homework assignments, and announcements. Students' progress, homework submissions, and enrolment records are stored as part of providing the service.</p>
        <p><strong className="text-[color:var(--hub-text)]">Communications:</strong> Direct messages and class announcements sent through the platform are stored to enable the messaging service.</p>
        <p><strong className="text-[color:var(--hub-text)]">Live session and recording data:</strong> When you join a live lesson, session metadata (join/leave times, participant list) is recorded. If a teacher enables recording, the video and audio of the session are stored in your teacher account. Recordings contain personal data of all participants.</p>
        <p><strong className="text-[color:var(--hub-text)]">AI-processed content:</strong> When you use AI features (session recaps, lesson plan generation, writing assistance), the relevant lesson content or text is transmitted to our AI service provider to generate the output. We do not retain this content in our AI provider's systems beyond the immediate processing request.</p>
        <p><strong className="text-[color:var(--hub-text)]">Payment information:</strong> Payments are processed by Dodo Payments, our third-party payment provider. We receive transaction records (amount, date, subscription status) but do not store full card or bank account details on our servers.</p>
        <p><strong className="text-[color:var(--hub-text)]">Technical data:</strong> We collect IP addresses, browser type, device identifiers, and session logs for security, fraud prevention, and service improvement.</p>
      </Section>

      <Section title="3. How we use your information">
        <p>We process your personal data under the following lawful bases as set out in the Act:</p>
        <p><strong className="text-[color:var(--hub-text)]">Performance of a contract:</strong> To create and manage your account; to facilitate lessons, messaging, and payments between teachers and students; to process subscription billing.</p>
        <p><strong className="text-[color:var(--hub-text)]">Compliance with a legal obligation:</strong> To retain financial records as required by Zimbabwean tax law; to respond to lawful requests from courts or regulators.</p>
        <p><strong className="text-[color:var(--hub-text)]">Legitimate interests:</strong> To detect and prevent fraud and abuse; to improve platform security; to send service-related notifications (such as session reminders and policy updates); to generate aggregated, anonymised analytics about platform usage.</p>
        <p><strong className="text-[color:var(--hub-text)]">Consent:</strong> To process lesson content through AI features (you consent by choosing to use those features and may stop at any time). We do not send marketing emails without your explicit opt-in.</p>
        <p>We do not sell your personal data to third parties.</p>
      </Section>

      <Section title="4. Data sharing and international transfers">
        <p>We share your data only with the following categories of recipients:</p>
        <p><strong className="text-[color:var(--hub-text)]">Supabase (infrastructure and database):</strong> Our platform is hosted on Supabase, which provides database, file storage, and authentication services. Supabase may process data in the United States or other jurisdictions outside Zimbabwe.</p>
        <p><strong className="text-[color:var(--hub-text)]">SignalWire (live video sessions):</strong> Video and audio during live lessons are facilitated by SignalWire, a US-based communications provider. Participant data (name, audio, video) is transmitted to SignalWire's infrastructure during live sessions.</p>
        <p><strong className="text-[color:var(--hub-text)]">Dodo Payments (payment processing):</strong> Subscription and lesson payment data is handled by Dodo Payments. Their privacy practices are governed by their own privacy policy.</p>
        <p><strong className="text-[color:var(--hub-text)]">AI service provider (Anthropic):</strong> Lesson content submitted to AI features is processed by Anthropic. Only the content you choose to submit is sent; we do not automatically forward all platform data.</p>
        <p><strong className="text-[color:var(--hub-text)]">Law enforcement and regulators:</strong> We will disclose data where required by a valid court order, warrant, or statutory obligation under Zimbabwean or applicable international law.</p>
        <p>Where data is transferred outside Zimbabwe, we ensure those transfers comply with Section 21 of the Act by putting in place appropriate contractual safeguards with each service provider. Teacher and student data is never sold or shared with advertisers.</p>
      </Section>

      <Section title="5. Data retention">
        <p>We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, subject to the following exceptions:</p>
        <p><strong className="text-[color:var(--hub-text)]">Financial records:</strong> Transaction and subscription records are retained for a minimum of 6 years as required by Zimbabwean tax and accounting law.</p>
        <p><strong className="text-[color:var(--hub-text)]">Recordings:</strong> Lesson recordings are stored until the teacher deletes them or the teacher's account is closed. Recordings are deleted within 30 days of account closure.</p>
        <p><strong className="text-[color:var(--hub-text)]">Backups:</strong> Encrypted database backups may retain data for up to 90 days after the deletion request, after which it is purged from backup archives.</p>
        <p>You can request deletion of specific recordings or messages at any time from within your account settings.</p>
      </Section>

      <Section title="6. Cookies and local storage">
        <p>We use essential session cookies and browser local storage to keep you logged in and to secure your session. These are strictly necessary for the platform to function and cannot be disabled without preventing login.</p>
        <p>We do not use advertising cookies, cross-site tracking cookies, or third-party analytics cookies. No cookie consent banner is displayed because we do not set any non-essential cookies.</p>
      </Section>

      <Section title="7. Your rights">
        <p>Under the Cyber and Data Protection Act [Chapter 12:07], you have the following rights in relation to your personal data:</p>
        <p><strong className="text-[color:var(--hub-text)]">Right to access:</strong> Request a copy of the personal data we hold about you.</p>
        <p><strong className="text-[color:var(--hub-text)]">Right to rectification:</strong> Request correction of inaccurate or incomplete data.</p>
        <p><strong className="text-[color:var(--hub-text)]">Right to erasure:</strong> Request deletion of your data (subject to our legal retention obligations).</p>
        <p><strong className="text-[color:var(--hub-text)]">Right to restrict processing:</strong> Ask us to pause processing of your data in certain circumstances, for example while a dispute is being resolved.</p>
        <p><strong className="text-[color:var(--hub-text)]">Right to data portability:</strong> Request your account data in a structured, machine-readable format.</p>
        <p><strong className="text-[color:var(--hub-text)]">Right to object:</strong> Object to processing based on our legitimate interests, including profiling.</p>
        <p><strong className="text-[color:var(--hub-text)]">Right to withdraw consent:</strong> Where we rely on your consent (e.g. for AI features), you may withdraw it at any time without affecting the lawfulness of prior processing.</p>
        <p><strong className="text-[color:var(--hub-text)]">Right not to be subject to automated decisions:</strong> We do not make decisions about you that have legal or significant effects based solely on automated processing.</p>
        <p>To exercise any of these rights, contact us at <strong className="text-[color:var(--hub-text)]">privacy@skillstream.world</strong>. We will respond within 30 days. If we are unable to meet the deadline we will notify you and give reasons.</p>
        <p>If you are not satisfied with our response, you have the right to lodge a complaint with the <strong className="text-[color:var(--hub-text)]">Zimbabwe Data Protection Authority (ZDPA)</strong>, the national supervisory authority for data protection in Zimbabwe.</p>
      </Section>

      <Section title="8. Security">
        <p>We use industry-standard security measures including encrypted connections (HTTPS/TLS), hashed passwords (bcrypt), row-level security controls on our database, and access controls that restrict which staff and systems can access personal data.</p>
        <p>In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify the ZDPA within 72 hours of becoming aware of it, and notify affected users as soon as reasonably practicable, as required by the Act.</p>
        <p>No system is 100% secure. Please use a strong, unique password and enable any available security features on your account.</p>
      </Section>

      <Section title="9. Children and young people">
        <p>SkillStream is not directed at children under 13. We do not knowingly collect personal data from children under 13 without verifiable parental consent. If you believe a child under 13 has created an account without consent, please contact us at <strong className="text-[color:var(--hub-text)]">privacy@skillstream.world</strong> immediately and we will delete the account.</p>
        <p>Students aged 13 to 17 may use the platform with the consent of a parent or legal guardian as described in our Terms of Service. We apply the same data protections to all users regardless of age. Teachers are responsible for ensuring that any recording of a lesson involving a minor is done with appropriate parental consent.</p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>We may update this Privacy Policy to reflect changes in law, platform features, or data processing practices. We will notify registered users of material changes by email and in-app notice at least 30 days before those changes take effect.</p>
      </Section>

      <Section title="11. Contact and complaints">
        <p>For privacy-related questions or to exercise your data rights, contact us at: <strong className="text-[color:var(--hub-text)]">privacy@skillstream.world</strong></p>
        <p>If you are not satisfied with how we have handled your request, you may lodge a complaint with the Zimbabwe Data Protection Authority (ZDPA), the body responsible for enforcing the Cyber and Data Protection Act in Zimbabwe.</p>
      </Section>

      <div className="mt-12 border-t border-[color:var(--hub-border)] pt-8 text-sm text-[color:var(--hub-muted)]">
        <Link to="/terms" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Terms of Service</Link>
        <span className="mx-3">·</span>
        <Link to="/" className="hover:underline">Back to home</Link>
      </div>
    </main>
  </div>
);
