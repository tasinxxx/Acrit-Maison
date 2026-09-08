import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Acrit Maison — Fine Jewelry, Quietly Made",
    template: "%s · Acrit Maison",
  },
  description:
    "Acrit Maison is a modern jewelry house: rings, necklaces, bracelets and earrings in gold and sterling silver, made in small batches and delivered across Bangladesh.",
  keywords: ["jewelry", "fine jewelry", "Bangladesh", "Dhaka", "gold jewelry", "sterling silver", "Acrit Maison"],
  openGraph: {
    type: "website",
    siteName: "Acrit Maison",
    title: "Acrit Maison — Fine Jewelry, Quietly Made",
    description:
      "A modern jewelry house. Rings, necklaces, bracelets and earrings in gold and sterling silver — delivered across Bangladesh.",
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#F7F3EC",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.storeName,
    url: SITE_URL,
    email: settings.storeEmail,
    telephone: settings.storePhone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
    ...(settings.instagramUrl ? { sameAs: [settings.instagramUrl, settings.facebookUrl].filter(Boolean) } : {}),
  };

  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <SiteHeader storeName={settings.storeName} whatsappNumber={settings.whatsappNumber} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
