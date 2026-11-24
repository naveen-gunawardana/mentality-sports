import Link from "next/link";

export const metadata = { title: "Privacy Policy | Mentality Sports" };

export default function PrivacyPage() {
  const updated = "March 21, 2025";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Legal</p>
        <h1 className="text-4xl font-bold text-navy mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
      </div>

      <div className="prose prose-navy max-w-none space-y-8 text-navy/80 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">1. Overview</h2>
          <p>Mentality Sports (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our platform. By using Mentality Sports, you agree to the practices described here.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Account information:</strong> name, email address, and password when you register</li>
            <li><strong>Profile information:</strong> sport background, position, bio, and profile photo you choose to provide</li>
            <li><strong>Usage data:</strong> pages visited, features used, and interactions within the platform</li>
            <li><strong>Messages:</strong> content of messages exchanged between matched mentors and athletes</li>
            <li><strong>Session notes:</strong> reflections and notes logged through the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">3. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Create and manage your account</li>
            <li>Match athletes with appropriate mentors</li>
            <li>Facilitate communication between matched users</li>
            <li>Send important platform notifications and updates</li>
            <li>Improve our platform and user experience</li>
            <li>Ensure safety and enforce our Terms of Service</li>
          </ul>
          <p className="mt-2">We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">4. Information Sharing</h2>
          <p>We share your information only in limited circumstances:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>With your match:</strong> your name, profile photo, bio, and messages are visible to your matched mentor or athlete</li>
            <li><strong>Service providers:</strong> trusted third-party services that help us operate the platform (such as database and authentication infrastructure), subject to confidentiality obligations</li>
            <li><strong>Legal requirements:</strong> if required by law or to protect the safety of users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">5. Data Storage and Security</h2>
          <p>Your data is stored securely using Supabase infrastructure. We implement industry-standard security measures including encryption in transit and at rest. However, no system is completely secure — we encourage you to use a strong, unique password and to keep your credentials private.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">6. Minors</h2>
          <p>Our platform is available to users aged 13 and older. Users under 18 must have parental or guardian consent. We do not knowingly collect information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us immediately.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, email us at <a href="mailto:hello@mentalitysports.com" className="text-orange-500 hover:underline">hello@mentalitysports.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">8. Cookies and Tracking</h2>
          <p>We use essential cookies to maintain your session and authenticate your account. We do not use advertising or tracking cookies. You may disable cookies in your browser settings, but this may affect platform functionality.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">9. Third-Party Links</h2>
          <p>Our platform may contain links to external resources and articles. We are not responsible for the privacy practices of those sites. We encourage you to review their privacy policies before submitting any information.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-navy mb-2">11. Contact</h2>
          <p>Questions about this Privacy Policy? Email us at <a href="mailto:hello@mentalitysports.com" className="text-orange-500 hover:underline">hello@mentalitysports.com</a>.</p>
          <p className="mt-2">For our full Terms of Service, see our <Link href="/terms" className="text-orange-500 hover:underline">Terms of Service</Link>.</p>
        </section>

      </div>
    </div>
  );
}
