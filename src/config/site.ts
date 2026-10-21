export const site = {
  name: "ShopWithAbhi",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  productionUrlPlaceholder: "https://YOUR_DOMAIN_HERE",
  description:
    "Thoughtful finds. Better everyday living. Independent product discovery, comparisons, and buying guides.",
  locale: "en-IN",
  currency: "INR",
  timezone: "Asia/Kolkata",
  logo: "/logo.svg",
  favicon: "/icon.svg",
  contactEmail: "",
  supportEmail: "",
  businessAddress: "",
  author: "ShopWithAbhi Editorial",
  copyrightStart: 2026,
  newsletter: { enabled: true, deliveryConfigured: false },
} as const;
export function publicOrigin() {
  const url = new URL(site.url);
  if (
    process.env.VERCEL_ENV === "production" &&
    (url.protocol !== "https:" || /localhost|YOUR_DOMAIN/i.test(url.hostname))
  )
    throw new Error(
      "Set NEXT_PUBLIC_SITE_URL to your real HTTPS production origin.",
    );
  return url.origin;
}
