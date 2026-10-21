import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import { site, publicOrigin } from "@/config/site";
import "./globals.css";
import "./publication.css";
import "./glass.css";
import "./account.css";
import "./palette.css";
import "./shopping.css";
import { getSettings, getCategories } from "@/lib/data";
import { initialCategories } from "@/config/navigation";
const sans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const heading = Manrope({ subsets: ["latin"], variable: "--font-heading" });
const defaultMetadata: Metadata = {
  metadataBase: new URL(publicOrigin()),
  title: {
    default: "ShopWithAbhi — Thoughtful finds. Better living.",
    template: "%s | ShopWithAbhi",
  },
  description: site.description,
  openGraph: { type: "website", locale: "en_IN", siteName: site.name },
  twitter: { card: "summary_large_image" },
};
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    ...defaultMetadata,
    title: {
      default: s.seoTitle || "ShopWithAbhi — Thoughtful finds. Better living.",
      template: `%s | ${s.siteName || site.name}`,
    },
    description: s.seoDescription || site.description,
    icons: s.favicon?.startsWith("/") ? { icon: s.favicon } : undefined,
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories(),
  ]);
  const navCategories = categories.length
    ? categories
    : process.env.NEXT_PUBLIC_CONVEX_URL
      ? []
      : initialCategories;
  return (
    <html lang="en-IN">
      <body className={`${sans.variable} ${heading.variable}`}>
        <Providers>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header
            name={settings.siteName}
            logo={settings.logo}
            categories={navCategories.map((c) => ({
              title: c.title,
              slug: c.slug,
              description: c.description,
            }))}
          />
          <main id="main">{children}</main>
          <Footer settings={settings} />
        </Providers>
      </body>
    </html>
  );
}
