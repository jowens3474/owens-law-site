import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { site } from "@/lib/site";
import { absoluteUrl } from "@/lib/markdown";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Set NEXT_PUBLIC_GA_ID (e.g. "G-XXXXXXXXXX") in the deployment environment to
// turn on Google Analytics. Left unset (as in local dev), nothing is loaded.
const gaId = process.env.NEXT_PUBLIC_GA_ID;

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "700", "800", "900"],
  style: ["normal", "italic"],
});

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

// Publisher identity for search engines and LLMs.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NewsMediaOrganization",
      "@id": absoluteUrl("/#org"),
      name: site.name,
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icon.png"),
      email: site.email,
      foundingDate: String(site.founded),
      description: site.description,
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: absoluteUrl("/"),
      name: site.name,
      description: site.description,
      publisher: { "@id": absoluteUrl("/#org") },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${source.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
