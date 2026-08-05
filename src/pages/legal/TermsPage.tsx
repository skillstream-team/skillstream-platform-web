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
      <p className="mt-3 text-sm text-[color:var(--hub-muted)]">Last updated: 12 July 2026</p>

      <Section title="1. Acceptance">
        <p>By creating an account or using SkillStream, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform. Your continued use after any update to these Terms constitutes acceptance of the revised version. We will give at least 30 days' notice of any material changes before they take effect.</p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be at least 18 years old to register as a teacher. Students must be at least 13 years old. If you are between 13 and 17, you may only use the platform with the knowledge and consent of a parent or legal guardian, who accepts these Terms on your behalf.</p>
        <p>By registering as a teacher you confirm that you have the legal right to offer educational services in your jurisdiction and that you have not been prohibited from working with minors by any court, regulatory body, or employer.</p>
        <p>You must provide accurate information when registering. You may not impersonate another person or misrepresent your qualifications.</p>
      </Section>

      <Section title="3. Your account">
        <p>You are responsible for keeping your login credentials secure and for all activity that occurs under your account. You must not share your account with anyone else or transfer it to another person.</p>
        <p>Notify us immediately at <strong className="text-[color:var(--hub-text)]">legal@skillstream.world</strong> if you suspect unauthorised access to your account.</p>
        <p>We reserve the right to suspend or permanently terminate accounts that violate these Terms, that are involved in fraudulent activity, or that have been inactive for more than 24 consecutive months after giving reasonable notice.</p>
      </Section>

      <Section title="4. Teacher responsibilities">
        <p>Teachers are solely responsible for all lesson content, materials, communications, and conduct with students on the platform. Content must not be illegal, harmful, misleading, defamatory, sexually explicit, or in violation of any third party's rights.</p>
        <p>Teachers must comply with all applicable laws and professional regulations governing education and tutoring in their own jurisdiction, including any requirements relating to working with minors.</p>
        <p>Teachers set their own lesson prices. SkillStream charges a platform fee as set out in the applicable subscription plan. You must not accept payment from students outside of the platform for services that would otherwise be facilitated through SkillStream.</p>
        <p>Where AI tools on the platform generate lesson plans, quizzes, session recaps, or other materials, you are responsible for reviewing those outputs before use. AI-generated content is provided as a draft aid only and may contain errors or inaccuracies.</p>
      </Section>

      <Section title="5. Student responsibilities">
        <p>Students must treat teachers and other participants with respect and must not engage in disruptive, abusive, or harassing behaviour. Violation of this may result in removal from a class or suspension of your account.</p>
        <p>Students must not share their login credentials with others, attempt to access classes they are not enrolled in, or record any session without the explicit consent of the teacher.</p>
        <p>Work submitted through the platform must be your own unless your teacher expressly permits otherwise. Use of SkillStream's AI writing assistance does not constitute academic honesty where your institution prohibits AI-assisted work — you are responsible for understanding and complying with your own institution's rules.</p>
      </Section>

      <Section title="6. Payments and subscriptions">
        <p>All prices on the platform are in United States Dollars (USD) unless otherwise stated. Teachers are responsible for any taxes, withholding obligations, or levies applicable to their earnings under the laws of Zimbabwe or their country of residence.</p>
        <p>Teacher subscriptions are billed monthly and renew automatically. You can cancel at any time in your account settings; your access continues until the end of the paid billing period and no pro-rata refund is issued for unused days.</p>
        <p>If you cancel a subscription within 7 days of your first payment and have not yet delivered any paid lessons to students, you may request a full refund by contacting <strong className="text-[color:var(--hub-text)]">legal@skillstream.world</strong>.</p>
        <p>Student payments for individual paid lessons are non-refundable once the lesson has taken place. If a teacher cancels a paid lesson without rescheduling, the student is entitled to a full refund of that lesson payment.</p>
        <p>Failed or disputed payments may result in temporary suspension of access until resolved. SkillStream is not responsible for losses arising from payment failures caused by your bank or payment provider.</p>
        <p>Promotional codes and affiliate discounts are applied at checkout and cannot be combined with other offers unless stated.</p>
      </Section>

      <Section title="7. Affiliate programme">
        <p>Teachers may participate in the SkillStream affiliate programme by sharing their unique referral code. When a new teacher registers using your code and activates a paid subscription, both parties receive a discount as configured at the time of the referral.</p>
        <p>Affiliate discounts apply to subscription fees only and have no cash value. You are responsible for declaring any affiliate-related income to the Zimbabwe Revenue Authority (ZIMRA) or other relevant tax authority. SkillStream may modify or discontinue the affiliate programme at any time with 30 days' notice to active participants.</p>
        <p>Fraudulent or self-referral use of affiliate codes will result in immediate disqualification and account review.</p>
      </Section>

      <Section title="8. Intellectual property">
        <p>You retain ownership of all original content you create and upload to the platform. By uploading content, you grant SkillStream a non-exclusive, royalty-free licence to store, display, deliver, and process that content as necessary to provide the service — including generating AI-assisted summaries or session recaps on your behalf.</p>
        <p>Lesson plans, quizzes, and other materials generated by SkillStream's AI tools at your direction are owned by you, subject to the terms of any third-party AI service provider used to generate them. SkillStream makes no ownership claim over AI-generated outputs.</p>
        <p>You must not upload content that infringes copyright or other intellectual property rights. If you believe content on the platform infringes your rights, contact <strong className="text-[color:var(--hub-text)]">legal@skillstream.world</strong> with details of the alleged infringement and we will investigate promptly.</p>
        <p>The SkillStream brand, logo, software, and design are our intellectual property. You may not copy, modify, reverse-engineer, or distribute them.</p>
      </Section>

      <Section title="9. Recordings">
        <p>Lesson recordings made through the platform are stored in your account for the period described in our Privacy Policy. You are responsible for informing all session participants that a recording will be made and for obtaining any consents required by applicable law before starting a recording.</p>
        <p>Recordings may contain personal data. You must handle recordings in compliance with the Cyber and Data Protection Act [Chapter 12:07] and must not share recordings with third parties outside of the intended educational purpose without participant consent.</p>
        <p>SkillStream does not access or view your recordings except as required to provide technical support you have requested, or as compelled by a lawful court order.</p>
      </Section>

      <Section title="10. AI tools">
        <p>SkillStream offers AI-powered features including lesson plan generation, quiz creation, session recaps, and student writing assistance. These features are powered by third-party AI services.</p>
        <p>AI-generated content may be inaccurate, incomplete, or inappropriate. SkillStream does not warrant the accuracy of AI outputs. Teachers must review all AI-generated materials before sharing them with students. Students must not rely on AI writing assistance as a substitute for independent understanding.</p>
        <p>By using AI features, you consent to the relevant lesson or session content being transmitted to our AI service provider for the purpose of generating the output. We do not use your content to train external AI models unless you give explicit consent.</p>
      </Section>

      <Section title="11. Limitation of liability">
        <p>To the maximum extent permitted by the laws of Zimbabwe, including the Consumer Protection Act [Chapter 14:44], SkillStream is not liable for indirect, incidental, special, or consequential losses arising from your use of the platform, including but not limited to loss of income, loss of data, or loss of opportunity.</p>
        <p>Nothing in these Terms limits our liability for fraud, gross negligence, or any liability that cannot lawfully be excluded.</p>
        <p>Your statutory rights under Zimbabwean consumer law are not affected by these Terms.</p>
      </Section>

      <Section title="12. Indemnification">
        <p>As a teacher, you agree to indemnify and hold harmless SkillStream, its directors, employees, and agents from any claims, losses, or expenses (including reasonable legal costs) arising from: your lesson content; your conduct towards students; your misrepresentation of qualifications; or your breach of these Terms.</p>
      </Section>

      <Section title="13. Changes to these terms">
        <p>We may update these Terms from time to time to reflect changes in law, platform features, or business practices. We will notify registered users of any material changes by email and in-app notice at least 30 days before those changes take effect. If you do not agree with revised Terms, you must stop using the platform before the effective date.</p>
      </Section>

      <Section title="14. Governing law and dispute resolution">
        <p>These Terms are governed by the laws of Zimbabwe. We encourage you to contact us at <strong className="text-[color:var(--hub-text)]">legal@skillstream.world</strong> to resolve any dispute informally before pursuing formal proceedings. Any dispute that cannot be resolved informally shall be subject to the exclusive jurisdiction of the High Court of Zimbabwe.</p>
      </Section>

      <Section title="15. General">
        <p>If any provision of these Terms is found to be unenforceable, the remaining provisions continue in full force. Our failure to enforce any right under these Terms does not constitute a waiver of that right. These Terms, together with our Privacy Policy, constitute the entire agreement between you and SkillStream in relation to your use of the platform.</p>
      </Section>

      <Section title="16. Contact">
        <p>For questions about these Terms, contact us at: <strong className="text-[color:var(--hub-text)]">legal@skillstream.world</strong></p>
      </Section>

      <div className="mt-12 border-t border-[color:var(--hub-border)] pt-8 text-sm text-[color:var(--hub-muted)]">
        <Link to="/privacy" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Privacy Policy</Link>
        <span className="mx-3">·</span>
        <Link to="/refund-policy" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Refund Policy</Link>
        <span className="mx-3">·</span>
        <Link to="/acceptable-use" className="font-semibold text-[color:var(--hub-primary)] hover:underline">Acceptable Use</Link>
        <span className="mx-3">·</span>
        <Link to="/" className="hover:underline">Back to home</Link>
      </div>
    </main>
  </div>
);
