import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";
import { Analytics } from "@vercel/analytics/react";

// One family, two widths: wide and heavy for display, normal for reading.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mentality Sports | Play like you practice",
  description:
    "Free 2-minute Game Day routines for the mental side of sport, plus mentors who've been there and team codes for coaches.",
  metadataBase: new URL("https://mentalitysports.com"),
  openGraph: {
    title: "Mentality Sports | Play like you practice",
    description:
      "Free 2-minute Game Day routines for the mental side of sport, plus mentors who've been there and team codes for coaches.",
    url: "https://mentalitysports.com",
    siteName: "Mentality Sports",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentality Sports | Play like you practice",
    description:
      "Free 2-minute Game Day routines for the mental side of sport, plus mentors who've been there and team codes for coaches.",
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
          text: "Yes, for every athlete, always. Mentors volunteer, and Mentality Sports is a nonprofit funded by grants and donations, not by athletes.",
        },
      },
      {
        "@type": "Question",
        name: "Is this therapy or mental health treatment?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Game Day routines and mentors are peer support for the mental side of sport, not treatment. Anyone struggling with something serious or feeling unsafe can call or text 988.",
        },
      },
      {
        "@type": "Question",
        name: "How does mentor matching work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Athletes ask for a mentor from their Locker Room and say what they want help with. A person on the team matches them with a volunteer mentor in their sport. Matching can take a few weeks; Game Day routines are available immediately.",
        },
      },
      {
        "@type": "Question",
        name: "How often do athletes and mentors meet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Once a week for four weeks, with messages in between. Athletes can re-enroll for another four weeks.",
        },
      },
      {
        "@type": "Question",
        name: "What sports does Mentality Sports support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "All sports. Mentality Sports started with high school basketball in San Francisco and now serves athletes in soccer, golf, football, track, swimming, lacrosse and more.",
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
          text: "Yes. Coaches can create a team and share a join code. They see team totals and average confidence, never what an individual athlete wrote.",
        },
      },
      {
        "@type": "Question",
        name: "What makes a Mentality Sports mentor qualified?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Mentors are current and former competitive athletes, most at the college level, who are reviewed before they are matched. Their qualification is lived experience with the same pressures.",
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
        className={`${archivo.variable} antialiased`}
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
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-whistle focus:px-4 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <Analytics />
        <Navigation />
        <main id="main" className="min-h-[calc(100vh-4rem)]">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
