import React from 'react';
import { Link } from 'react-router-dom';
import { SkillStreamLogo } from '../../components/branding/SkillStreamLogo';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-10">
    <h2 className="text-xl font-bold text-[color:var(--hub-text)]">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-[color:var(--hub-muted)]">{children}</div>
  </div>
);

export const AcceptableUsePolicyPage: React.FC = () => (
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
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[color:var(--hub-text)]">Acceptable Use Policy</h1>
      <p className="mt-3 text-sm text-[color:var(--hub-muted)]">Last updated: 12 July 2026</p>

      <Section title="1. Purpose">
        <p>This Acceptable Use Policy ("AUP") sets out what is and is not permitted on SkillStream. It applies to all users — teachers, students, and administrators — and supplements the <Link to="/terms" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Terms of Service</Link>. Breaching this policy may result in content removal, account suspension, or permanent termination.</p>
      </Section>

      <Section title="2. Prohibited content">
        <p>You must not upload, share, post, or transmit any content that:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Is sexually explicit, pornographic, or exploits or sexualises minors in any way</li>
          <li>Promotes, glorifies, or incites violence, terrorism, or self-harm</li>
          <li>Constitutes hate speech targeting a person or group based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin</li>
          <li>Is defamatory, harassing, threatening, or designed to intimidate another person</li>
          <li>Is deliberately false or misleading, including misrepresentation of teaching qualifications or credentials</li>
          <li>Infringes copyright, trademarks, patents, or other intellectual property rights of any third party</li>
          <li>Contains malware, viruses, phishing links, or any code intended to harm users or systems</li>
          <li>Violates any applicable law or regulation in Zimbabwe or in the user's own country</li>
        </ul>
      </Section>

      <Section title="3. Prohibited behaviour">
        <p>You must not:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Harass, bully, stalk, or intimidate any other user on or off the platform in connection with SkillStream</li>
          <li>Impersonate any person or entity, or misrepresent your identity or affiliation</li>
          <li>Collect or harvest other users' personal data without their consent</li>
          <li>Use the platform to send unsolicited commercial messages (spam)</li>
          <li>Attempt to gain unauthorised access to any account, system, or data</li>
          <li>Use automated scripts, bots, or scrapers on the platform without our written permission</li>
          <li>Reverse-engineer, decompile, or attempt to extract source code from the SkillStream software</li>
          <li>Conduct or facilitate any denial-of-service attack or other disruption of the platform</li>
          <li>Circumvent any access controls, payment systems, or security measures on the platform</li>
        </ul>
      </Section>

      <Section title="4. Teacher-specific rules">
        <p>Teachers additionally must not:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Accept payment from students enrolled through SkillStream for those same services outside the platform (payment circumvention)</li>
          <li>Misrepresent professional qualifications, experience, or certifications in their profile or lessons</li>
          <li>Use student data obtained through the platform for purposes unrelated to teaching (e.g. marketing, resale)</li>
          <li>Record lessons involving minors without appropriate parental consent</li>
          <li>Share AI-generated content with students without reviewing it for accuracy and appropriateness</li>
        </ul>
      </Section>

      <Section title="5. Student-specific rules">
        <p>Students additionally must not:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Share login credentials or access another student's account</li>
          <li>Record any lesson without the teacher's explicit consent</li>
          <li>Submit work generated by AI tools as their own where their institution prohibits it</li>
          <li>Disrupt live sessions by playing audio, sharing inappropriate screen content, or refusing to follow reasonable teacher instructions</li>
        </ul>
      </Section>

      <Section title="6. AI tools">
        <p>SkillStream's AI features (lesson plan generation, quiz creation, session recaps, writing assistance) must not be used to:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Generate any content that would otherwise be prohibited under Section 2 of this policy</li>
          <li>Create academic work intended to deceive examiners or institutions</li>
          <li>Process personal data of third parties not present on the platform</li>
          <li>Attempt to extract confidential information about SkillStream's systems or other users</li>
        </ul>
      </Section>

      <Section title="7. Reporting violations">
        <p>If you believe someone is violating this policy, report it by emailing <strong className="text-[color:var(--hub-text)]">report@skillstream.world</strong> with a description of the issue and, where possible, supporting evidence (screenshots, message content). We treat all reports confidentially.</p>
        <p>Teachers can also remove students from their classes immediately using the class management tools if a student is being disruptive.</p>
      </Section>

      <Section title="8. Enforcement">
        <p>We review reported violations and use our judgement in determining appropriate action. Depending on the severity and history of violations, this may include:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Removal of offending content</li>
          <li>A formal warning to the user</li>
          <li>Temporary suspension of the account</li>
          <li>Permanent termination of the account without refund</li>
          <li>Referral to law enforcement where required by law or where we believe a crime has been committed</li>
        </ul>
        <p>We will aim to notify you of the action taken and the reason, except where doing so would compromise an ongoing investigation or legal obligation.</p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>We may update this AUP to reflect new platform features or changes in applicable law. We will notify registered users of material changes at least 30 days in advance. Continued use of the platform after the effective date of an updated AUP constitutes acceptance.</p>
      </Section>

      <Section title="10. Contact">
        <p>To report a violation: <strong className="text-[color:var(--hub-text)]">report@skillstream.world</strong></p>
        <p>For general policy questions: <strong className="text-[color:var(--hub-text)]">legal@skillstream.world</strong></p>
      </Section>

      <div className="mt-12 border-t border-[color:var(--hub-border)] pt-8 text-sm text-[color:var(--hub-muted)]">
        <Link to="/terms" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Terms of Service</Link>
        <span className="mx-3">·</span>
        <Link to="/refund-policy" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Refund Policy</Link>
        <span className="mx-3">·</span>
        <Link to="/" className="hover:underline">Back to home</Link>
      </div>
    </main>
  </div>
);
