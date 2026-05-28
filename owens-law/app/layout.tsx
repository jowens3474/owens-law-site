import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { site, practiceAreas, serviceAreas } from "@/lib/site";
import { absoluteUrl } from "@/lib/seo";
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
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// LegalService / Attorney structured data — this is what wins the Google
// local pack and rich results for "personal injury lawyer near me" searches.
const legalServiceJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LegalService", "Attorney"],
      "@id": absoluteUrl("/#firm"),
      name: site.name,
      url: absoluteUrl("/"),
      image: absoluteUrl("/icon.png"),
      logo: absoluteUrl("/icon.png"),
      email: site.email,
      telephone: site.phone,
      priceRange: "Free Consultation — No Fee Unless We Win",
      foundingDate: String(site.founded),
      description: site.description,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.state,
        postalCode: site.address.zip,
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: site.geo.lat,
        longitude: site.geo.lng,
      },
      areaServed: serviceAreas.map((a) => ({
        "@type": "City",
        name: `${a}, Mississippi`,
      })),
      knowsAbout: practiceAreas.map((p) => p.name),
      makesOffer: practiceAreas.map((p) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: p.name },
      })),
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: absoluteUrl("/"),
      name: site.name,
      description: site.description,
      publisher: { "@id": absoluteUrl("/#firm") },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${source.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(legalServiceJsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  );
}
