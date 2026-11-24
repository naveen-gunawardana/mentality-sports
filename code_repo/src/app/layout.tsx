import type { Metadata } from "next";
import { Outfit, Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Logo } from "@/components/logo";
import { Analytics } from "@vercel/analytics/react";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mentality Sports | Athlete Mentorship & Mental Performance",
  description:
    "Mentality Sports connects athletes with mentors who've lived it — real relationships built on mental resilience, honest sport guidance, and the support no coach is trained to give.",
  metadataBase: new URL("https://mentalitysports.com"),
  openGraph: {
    title: "Mentality Sports | Athlete Mentorship & Mental Performance",
    description:
      "Mentality Sports connects athletes with mentors who've lived it — real relationships built on mental resilience, honest sport guidance, and the support no coach is trained to give.",
    url: "https://mentalitysports.com",
    siteName: "Mentality Sports",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentality Sports | Athlete Mentorship & Mental Performance",
    description:
      "Mentality Sports connects athletes with mentors who've lived it — real relationships built on mental resilience, honest sport guidance, and the support no coach is trained to give.",
    images: ["/opengraph-image"],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://mentalitysports.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 1. NonprofitOrganization — tells search engines and AI models what
  //    Mentality Sports is, who runs it, where it operates, and how to
  //    contact it. Most specific applicable schema.org type for a nonprofit
  //    mentorship platform.
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": ["NonprofitOrganization", "EducationalOrganization"],
    name: "Mentality Sports",
    alternateName: "Mentality",
    url: "https://mentalitysports.com",
    email: "hello@mentalitysports.com",
    description:
      "Mentality Sports is a nonprofit mentorship platform that connects high school athletes with current and former college athletes for free, 1-on-1 mental performance support — covering confidence, anxiety, motivation, identity, and resilience.",
    foundingDate: "2025",
    nonprofitStatus: "Nonprofit501c3",
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      addressCountry: "US",
    },
    areaServed: [
      { "@type": "City", name: "San Francisco" },
      { "@type": "State", name: "California" },
      { "@type": "Country", name: "United States" },
    ],
    founder: [
      { "@type": "Person", name: "Naveen", jobTitle: "CEO & Founder" },
      { "@type": "Person", name: "Juli", jobTitle: "CMO & Co-Founder" },
    ],
    member: [
      { "@type": "Person", name: "TJ", jobTitle: "CFO" },
      { "@type": "Person", name: "Peter", jobTitle: "COO" },
      { "@type": "Person", name: "Logan", jobTitle: "President" },
    ],
    sameAs: [
      "https://www.instagram.com/mentalitysports",
      "https://www.tiktok.com/@mentalitysports.com",
    ],
    knowsAbout: [
      "Sports psychology",
      "Athlete mental health",
      "Mental performance",
      "Peer mentorship",
      "Youth athlete development",
      "Basketball",
      "Sports confidence",
      "Athletic resilience",
    ],
    audience: {
      "@type": "Audience",
      audienceType: "High school athletes ages 13–18",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "All services are completely free for athletes",
    },
  };

  // 2. FAQPage — surfaces Q&A pairs directly in Google search results and
  //    gives AI models authoritative answers to common customer questions,
  //    reducing the chance they give wrong information about the service.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is Mentality Sports free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Mentality Sports is 100% free for athletes, forever. Mentors volunteer their time. The platform is funded through nonprofit grants and school/team partnerships, not athlete fees.",
        },
      },
      {
        "@type": "Question",
        name: "Is this therapy or mental health treatment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Mentality Sports is peer mentorship, not therapy or clinical mental health treatment. Every mentor is a current or former college athlete — not a licensed therapist. If an athlete is in crisis, we refer them to qualified mental health professionals.",
        },
      },
      {
        "@type": "Question",
        name: "How does mentor matching work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Athletes sign up and share their sport, level, and what they are working through mentally. The platform matches them with a mentor based on shared athletic background and relevant experience.",
        },
      },
      {
        "@type": "Question",
        name: "How often do athletes and mentors meet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Weekly check-ins are suggested, but scheduling is flexible and fits around the athlete's school and practice schedule. The minimum mentor commitment is approximately 15 minutes per week.",
        },
      },
      {
        "@type": "Question",
        name: "What sports does Mentality Sports support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The pilot launched with basketball in San Francisco, but the platform is designed for all sports. We are actively expanding beyond basketball to serve athletes across every sport.",
        },
      },
      {
        "@type": "Question",
        name: "What if my mentor is not the right fit?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Re-matching is supported. A genuine relationship matters more than sticking with a bad match. Contact us at hello@mentalitysports.com and we will find a better fit.",
        },
      },
      {
        "@type": "Question",
        name: "Can coaches or schools refer players?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Coaches, parents, and athletes can sign up directly at mentalitysports.com. School and team partnerships are also available — email hello@mentalitysports.com.",
        },
      },
      {
        "@type": "Question",
        name: "What makes a Mentality Sports mentor qualified?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Mentors are current or former college-level athletes. Their qualification is lived experience — they have been through the same mental challenges the athletes they mentor are facing now, including playing time anxiety, confidence gaps, identity struggles, and coach pressure.",
        },
      },
    ],
  };

  // 3. ItemList of Service schemas — one entry per core service. Helps
  //    search engines and AI models understand the specific offerings
  //    without conflating them with general coaching or therapy products.
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Mentality Sports Services",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Service",
          name: "1-on-1 Athlete Mentor Matching",
          description:
            "Athletes are matched with a current or former college athlete for ongoing 1-on-1 mental performance mentorship based on sport, level, and personal challenges.",
          provider: { "@type": "NonprofitOrganization", name: "Mentality Sports" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          audience: { "@type": "Audience", audienceType: "High school athletes ages 13–18" },
        },
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "Service",
          name: "Private Messaging Platform",
          description:
            "Secure direct messaging between athlete and mentor for support between scheduled sessions.",
          provider: { "@type": "NonprofitOrganization", name: "Mentality Sports" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "Service",
          name: "Athlete Reflection Journal",
          description:
            "A structured journaling tool where athletes log mental state, wins, and struggles after practices and games to build self-awareness over time.",
          provider: { "@type": "NonprofitOrganization", name: "Mentality Sports" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
      {
        "@type": "ListItem",
        position: 4,
        item: {
          "@type": "Service",
          name: "Weekly Mental Goal Tracking",
          description:
            "Athletes set weekly mental performance goals with their mentor and track completion over time to measure growth in confidence and resilience.",
          provider: { "@type": "NonprofitOrganization", name: "Mentality Sports" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
      {
        "@type": "ListItem",
        position: 5,
        item: {
          "@type": "Service",
          name: "Sports Mental Health Advice Library",
          description:
            "A curated library of articles and resources covering confidence, anxiety, motivation, identity, and resilience — available 24/7 without a scheduled session.",
          provider: { "@type": "NonprofitOrganization", name: "Mentality Sports" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        },
      },
    ],
  };

  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} ${barlowCondensed.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
        />
        <Analytics />
        <Navigation />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="border-t border-navy-700 bg-navy text-white">
          <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-20 xl:px-32">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <div>
                <div className="mb-4">
                  <Logo href="/" variant="light" size="sm" />
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  Mentorship, resources, and community for the mental side of sport. Open to athletes and coaches across all sports.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Explore</p>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="/programs" className="text-white/60 hover:text-white transition-colors">All Programs</a></li>
                  <li><a href="/mentorship" className="text-white/60 hover:text-white transition-colors">1-on-1 Mentorship</a></li>
                  <li><a href="/advice" className="text-white/60 hover:text-white transition-colors">Resource Library</a></li>
                  <li><a href="/newsletter" className="text-white/60 hover:text-white transition-colors">Newsletter</a></li>
                  <li><a href="/podcast" className="text-white/60 hover:text-white transition-colors">Podcast</a></li>
                  <li>
                    <a href="https://www.instagram.com/mentalitysports" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                      </svg>
                      @mentalitysports
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Join Us</p>
                <p className="text-sm text-white/60 mb-4 leading-relaxed">
                  Currently in pilot. Open to athletes, coaches, and mentors across all sports.
                </p>
                <a href="/signup" className="inline-block rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
                  Get Involved
                </a>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-white/8 text-xs text-white/25 text-center space-y-2">
              <div className="flex justify-center gap-4">
                <a href="/terms" className="hover:text-white/50 transition-colors">Terms of Service</a>
                <a href="/privacy" className="hover:text-white/50 transition-colors">Privacy Policy</a>
                <a href="mailto:hello@mentalitysports.com" className="hover:text-white/50 transition-colors">Contact</a>
              </div>
              <div>&copy; {new Date().getFullYear()} Mentality Sports. All rights reserved.</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
