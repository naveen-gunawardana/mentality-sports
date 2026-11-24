import Link from "next/link";

export const metadata = { title: "Terms of Service | Mentality Sports" };

export default function TermsPage() {
  const updated = "March 21, 2025";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-navy mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
      </div>

      <div className="prose prose-navy max-w-none space-y-8 text-navy/80 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">1. Acceptance of Terms</h2>
          <p>By creating an account or using Mentality Sports (&ldquo;the Platform&rdquo;), you agree to these Terms of Service. If you do not agree, do not use the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">2. Who We Are</h2>
          <p>Mentality Sports is a mentorship platform that connects athletes (&ldquo;players&rdquo;) with current or former athletes (&ldquo;mentors&rdquo;) for the purpose of mental performance support and personal development through sport.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">3. Eligibility</h2>
          <p>You must be at least 13 years old to use this Platform. If you are under 18, you must have parental or guardian consent. By using the Platform, you represent that you meet these requirements.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">4. Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to provide accurate information during registration and to keep it up to date.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">5. Mentor Relationships</h2>
          <p>Mentors on this Platform are volunteers who share their personal sport experience. They are not licensed therapists, counselors, or mental health professionals. The mentorship provided is peer-based and informational in nature. If you are experiencing a mental health crisis, please contact a qualified professional or call a crisis helpline.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Harass, bully, or threaten any other user</li>
            <li>Share false or misleading information</li>
            <li>Use the Platform for any commercial solicitation</li>
            <li>Attempt to access other users&apos; accounts or data</li>
            <li>Share explicit, harmful, or illegal content</li>
          </ul>
          <p className="mt-2">Violation of these rules may result in immediate account termination.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">7. Content</h2>
          <p>You retain ownership of content you submit. By submitting content, you grant Mentality Sports a non-exclusive license to display and use that content in connection with the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">8. Privacy</h2>
          <p>Your use of the Platform is also governed by our <Link href="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">9. Termination</h2>
          <p>We reserve the right to suspend or terminate any account at any time, for any reason, including violations of these Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">10. Disclaimers</h2>
          <p>The Platform is provided &ldquo;as is.&rdquo; We make no warranties about the availability, accuracy, or fitness for a particular purpose of the Platform or its content. We are not liable for any damages arising from your use of the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">11. Changes</h2>
          <p>We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">12. Contact</h2>
          <p>Questions about these Terms? Email us at <a href="mailto:hello@mentalitysports.com" className="text-orange-500 hover:underline">hello@mentalitysports.com</a>.</p>
        </section>

      </div>
    </div>
  );
}
